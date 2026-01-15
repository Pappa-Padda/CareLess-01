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
      orderBy: {
        group: {
          name: 'asc',
        },
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
      where: { 
        groupId,
        date: {
          gte: new Date(),
        },
      },
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
                addressList: {
                  where: { isDefault: true },
                  take: 1,
                  include: { address: true }
                }
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
                addressList: {
                    where: { isDefault: true },
                    take: 1,
                    include: { address: true }
                }
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
                    addressList: {
                        where: { isDefault: true },
                        take: 1,
                        include: { address: true }
                    }
                  },
                },
              },
            },
            pickup: {
              include: {
                address: true,
              },
            },
          },
        },
      },
    });

    const eventAddress = await prisma.address.findUnique({ where: { id: event.addressId } });

    return res.json({
      event: {
        id: event.id,
        name: event.name,
        date: event.date,
        location: {
            lat: eventAddress?.latitude ? Number(eventAddress.latitude) : null,
            lng: eventAddress?.longitude ? Number(eventAddress.longitude) : null,
            address: eventAddress?.street
        }
      },
      unassigned: unassigned.map(r => ({
        id: r.id,
        passengerId: r.passengerId,
        name: r.passenger.user.name,
        profilePicture: r.passenger.user.profilePicture,
        defaultAddressNickname: r.passenger.user.addressList[0]?.address.nickname || 'Home',
        location: r.passenger.user.addressList[0]?.address ? {
            lat: Number(r.passenger.user.addressList[0].address.latitude),
            lng: Number(r.passenger.user.addressList[0].address.longitude),
            address: r.passenger.user.addressList[0].address.street
        } : null
      })),
      offers: offers.map(o => ({
        id: o.id,
        driverName: o.driver.user.name,
        driverProfilePicture: o.driver.user.profilePicture,
        driverLocation: o.driver.user.addressList[0]?.address ? {
            lat: Number(o.driver.user.addressList[0].address.latitude),
            lng: Number(o.driver.user.addressList[0].address.longitude)
        } : null,
        carInfo: `${o.car.make} ${o.car.model}`,
        totalSeats: o.car.seatCapacity,
        availableSeats: o.availableSeats,
        passengers: o.allocations.map(a => ({
          id: a.passengerId,
          name: a.passenger.user.name,
          pickupTime: a.pickup.time,
          pickupAddress: a.pickup.address.nickname || a.pickup.address.street,
          pickupPointId: a.pickup.groupId === null && a.pickup.addressId !== a.passenger.user.addressList[0]?.addressId ? a.pickup.id : (a.pickup.groupId ? a.pickup.id : undefined),
          defaultAddressNickname: a.passenger.user.addressList[0]?.address.nickname || 'Home',
          location: {
            lat: Number(a.pickup.address.latitude),
            lng: Number(a.pickup.address.longitude)
          }
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
        const { passengerId, liftOfferId, pickupPointId } = assignment;

        let finalPickupId: number | undefined;

        if (pickupPointId) {
            const groupPickup = await tx.pickup.findUnique({ where: { id: Number(pickupPointId) } });
            if (groupPickup) {
                finalPickupId = groupPickup.id;
            }
        }

        if (!finalPickupId) {
            let addressId = event.addressId;
            const pickupTime = event.startTime;

            const addressAssoc = await tx.addressList.findFirst({
              where: { userId: passengerId },
              orderBy: { rank: 'asc' },
            });
            if (addressAssoc) {
                addressId = addressAssoc.addressId;
            }

            const pickup = await tx.pickup.create({
              data: {
                addressId,
                time: pickupTime, 
                passengerCount: 1,
              },
            });
            finalPickupId = pickup.id;
        }

        await tx.passengerAllocation.create({
          data: {
            liftOfferId,
            passengerId,
            pickupId: finalPickupId!,
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

export const clearAllocations = async (req: Request, res: Response) => {
  try {
    const eventId = Number(req.params.eventId);
    const userId = (req as any).user?.userId;

    if (!userId) return res.status(401).json({ error: 'Not authenticated' });
    if (isNaN(eventId)) return res.status(400).json({ error: 'Invalid event ID' });

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
      // 1. Get all offers for this event
      const offers = await tx.liftOffer.findMany({
        where: { eventId, date: event.date },
      });
      const offerIds = offers.map(o => o.id);

      // 2. Delete all allocations for these offers
      await tx.passengerAllocation.deleteMany({
        where: { liftOfferId: { in: offerIds } },
      });

      // 3. Reset all lift requests for this event to PENDING
      await tx.liftRequest.updateMany({
        where: { eventId, date: event.date },
        data: { status: 'PENDING' },
      });
    });

    return res.json({ ok: true });
  } catch (err) {
    console.error('Clear Allocations Error:', err);
    return res.status(500).json({ error: 'Failed to clear allocations' });
  }
};