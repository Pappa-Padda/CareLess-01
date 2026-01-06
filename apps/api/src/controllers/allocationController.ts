import { Request, Response } from 'express';
import { prisma } from '@repo/database';

export const getAdminGroups = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });

    const groups = await prisma.userGroupAssociation.findMany({
      where: {
        userId,
        isAdmin: true,
      },
      include: {
        group: true,
      },
    });

    return res.json({ groups: groups.map(g => g.group) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
};

export const getEventsForGroup = async (req: Request, res: Response) => {
  try {
    const groupId = Number(req.params.groupId);
    if (isNaN(groupId)) return res.status(400).json({ error: 'Invalid group ID' });

    const events = await prisma.event.findMany({
      where: { groupId },
      orderBy: { date: 'asc' },
    });

    return res.json({ events });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
};

export const getAllocationData = async (req: Request, res: Response) => {
  try {
    const eventId = Number(req.params.eventId);
    if (isNaN(eventId)) return res.status(400).json({ error: 'Invalid event ID' });

    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) return res.status(404).json({ error: 'Event not found' });

    // 1. Get all pending lift requests for this event
    const unassigned = await prisma.liftRequest.findMany({
      where: {
        eventId,
        date: event.date,
        status: 'PENDING',
      },
      include: {
        passenger: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                profilePicture: true,
                phoneNumber: true,
              },
            },
          },
        },
      },
    });

    // 2. Get all lift offers for this event
    const offers = await prisma.liftOffer.findMany({
      where: {
        eventId,
        date: event.date,
      },
      include: {
        driver: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                profilePicture: true,
              },
            },
          },
        },
        car: true,
        allocations: {
          include: {
            passenger: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return res.json({
      unassigned: unassigned.map(r => ({
        id: r.id,
        passengerId: r.passengerId,
        name: r.passenger.user.name,
        profilePicture: r.passenger.user.profilePicture,
      })),
      offers: offers.map(o => ({
        id: o.id,
        driverName: o.driver.user.name,
        driverProfilePicture: o.driver.user.profilePicture,
        carInfo: `${o.car.make} ${o.car.model}`,
        totalSeats: o.car.seatCapacity,
        availableSeats: o.availableSeats,
        passengers: o.allocations.map(a => ({
          id: a.passengerId,
          name: a.passenger.user.name,
        })),
      })),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
};

export const commitAssignments = async (req: Request, res: Response) => {
  try {
    const { eventId, assignments } = req.body; // assignments: [{ passengerId, liftOfferId }]
    const userId = (req as any).user?.userId;

    if (!userId) return res.status(401).json({ error: 'Not authenticated' });
    if (!eventId || !Array.isArray(assignments)) {
      return res.status(400).json({ error: 'Invalid payload' });
    }

    // Verify admin status
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { group: true },
    });

    if (!event) return res.status(404).json({ error: 'Event not found' });

    const adminCheck = await prisma.userGroupAssociation.findUnique({
      where: {
        userId_groupId: {
          userId,
          groupId: event.groupId,
        },
      },
    });

    if (!adminCheck || !adminCheck.isAdmin) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Run transaction
    await prisma.$transaction(async (tx) => {
      // 1. Get all offers for this event to clear them
      const offers = await tx.liftOffer.findMany({
        where: { eventId, date: event.date },
      });
      const offerIds = offers.map(o => o.id);

      // 2. Clear existing allocations for these offers
      await tx.passengerAllocation.deleteMany({
        where: { liftOfferId: { in: offerIds } },
      });

      // 3. Reset all lift requests for this event to PENDING
      await tx.liftRequest.updateMany({
        where: { eventId, date: event.date },
        data: { status: 'PENDING' },
      });

      // 4. Create new allocations and update request status
      for (const assignment of assignments) {
        const { passengerId, liftOfferId } = assignment;

        // Find/Create a default pickup for this passenger
        // For now, we'll find the passenger's first address or use a placeholder
        const addressAssoc = await tx.addressList.findFirst({
          where: { userId: passengerId },
          orderBy: { rank: 'asc' },
        });

        // Use a default address if none found (fallback)
        const addressId = addressAssoc?.addressId || event.addressId;

        const pickup = await tx.pickup.create({
          data: {
            addressId,
            time: event.startTime, // Default to event start time
            passengerCount: 1,
          },
        });

        await tx.passengerAllocation.create({
          data: {
            liftOfferId,
            passengerId,
            pickupId: pickup.id,
          },
        });

        // Mark request as ASSIGNED
        await tx.liftRequest.update({
          where: {
            passengerId_eventId_date: {
              passengerId,
              eventId,
              date: event.date,
            },
          },
          data: { status: 'ASSIGNED' },
        });
      }
    });

    return res.json({ ok: true });
  } catch (err) {
    console.error('Commit Error:', err);
    return res.status(500).json({ error: 'Failed to commit assignments' });
  }
};
