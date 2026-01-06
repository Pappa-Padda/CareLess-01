import { Request, Response } from 'express';
import { prisma } from '@repo/database';

export const getMyOffers = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });

    const offers = await prisma.liftOffer.findMany({
      where: { driverId: userId },
    });

    return res.json({ offers });
  } catch (err) {
    console.error('Error fetching lift offers:', err);
    return res.status(500).json({ error: 'Failed to fetch offers' });
  }
};

export const getDriverDashboard = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const offers = await prisma.liftOffer.findMany({
      where: {
        driverId: userId,
        date: {
          gte: now,
        },
      },
      include: {
        event: {
          include: {
            address: true,
            group: {
              select: { name: true, profilePicture: true },
            },
          },
        },
        car: true,
        allocations: {
          include: {
            passenger: {
              include: {
                user: {
                  select: { name: true, phoneNumber: true, profilePicture: true },
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
      orderBy: {
        date: 'asc',
      },
    });

    // Transform for easier frontend consumption
    const dashboardItems = offers.map(offer => ({
      id: offer.id,
      date: offer.date,
      availableSeats: offer.availableSeats,
      notes: offer.notes,
      event: offer.event,
      car: offer.car,
      passengers: offer.allocations.map(alloc => ({
        id: alloc.passengerId,
        name: alloc.passenger.user.name,
        phoneNumber: alloc.passenger.user.phoneNumber,
        profilePicture: alloc.passenger.user.profilePicture,
        isConfirmed: alloc.isConfirmed,
        pickup: alloc.pickup,
      })),
    }));

    return res.json({ offers: dashboardItems });
  } catch (err) {
    console.error('Error fetching driver dashboard:', err);
    return res.status(500).json({ error: 'Failed to fetch driver dashboard' });
  }
};

export const createLiftOffer = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    console.log('Creating lift offer for user:', userId, 'body:', req.body);
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });

    const { eventId, date, carId, availableSeats, isReturning, notes } = req.body;

    if (!eventId || !carId || !date) {
      return res.status(400).json({ error: 'Event ID, Date, and Car ID are required' });
    }
    
    const eventIdNum = Number(eventId);
    const carIdNum = Number(carId);

    if (isNaN(eventIdNum) || isNaN(carIdNum)) {
        return res.status(400).json({ error: 'Invalid ID format' });
    }

    // Verify Car belongs to Driver
    const car = await prisma.car.findUnique({ where: { id: carIdNum } });
    if (!car || car.driverId !== userId) {
      return res.status(403).json({ error: 'Invalid car selected' });
    }

    // Check if offer already exists for this event and date
    const existingOffer = await prisma.liftOffer.findFirst({
        where: {
            driverId: userId,
            eventId: eventIdNum,
            date: new Date(date)
        }
    });

    if (existingOffer) {
        return res.status(400).json({ error: 'Offer already exists for this event date' });
    }

    // Use car capacity if availableSeats not provided
    const seats = availableSeats ? Number(availableSeats) : (car.seatCapacity - 1); // -1 for driver

    const offer = await prisma.liftOffer.create({
      data: {
        driverId: userId,
        eventId: eventIdNum,
        date: new Date(date),
        carId: carIdNum,
        availableSeats: seats > 0 ? seats : 0,
        isReturning: !!isReturning,
        notes: notes || '',
      },
    });

    return res.json({ offer });
  } catch (err) {
    console.error('Error creating lift offer:', err);
    return res.status(500).json({ error: 'Failed to create offer' });
  }
};

export const deleteLiftOffer = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const eventId = Number(req.params.eventId);
    const date = req.query.date as string;

    if (!userId) return res.status(401).json({ error: 'Not authenticated' });
    if (!eventId || !date) return res.status(400).json({ error: 'Event ID and Date are required' });

    // Find the offer first
    const offer = await prisma.liftOffer.findFirst({
        where: {
            driverId: userId,
            eventId: eventId,
            date: new Date(date)
        }
    });

    if (!offer) {
        return res.json({ ok: true }); // Already gone
    }

    await prisma.liftOffer.delete({
        where: { id: offer.id }
    });

    return res.json({ ok: true });
  } catch (err) {
    console.error('Error deleting lift offer:', err);
    return res.status(500).json({ error: 'Failed to delete offer' });
  }
};
