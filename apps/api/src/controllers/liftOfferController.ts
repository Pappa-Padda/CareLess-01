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

    if (!eventId || !date) {
      return res.status(400).json({ error: 'Event ID and Date are required' });
    }
    
    const eventIdNum = Number(eventId);
    let carIdNum = Number(carId);

    // If no car provided, look for default
    if (!carId || isNaN(carIdNum)) {
        const defaultCar = await prisma.car.findFirst({
            where: { driverId: userId, isDefault: true }
        });
        if (!defaultCar) {
            return res.status(400).json({ error: 'No car selected and no default car found.' });
        }
        carIdNum = defaultCar.id;
    }

    if (isNaN(eventIdNum)) {
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

export const updateLiftOfferCar = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const offerId = Number(req.params.id);
    const { carId, force } = req.body;

    if (!userId) return res.status(401).json({ error: 'Not authenticated' });
    if (isNaN(offerId) || !carId) return res.status(400).json({ error: 'Invalid parameters' });

    // 1. Fetch Offer & Allocations
    const offer = await prisma.liftOffer.findUnique({
      where: { id: offerId },
      include: { allocations: true }
    });

    if (!offer) return res.status(404).json({ error: 'Offer not found' });
    if (offer.driverId !== userId) return res.status(403).json({ error: 'Not authorized' });

    // 2. Fetch New Car
    const newCar = await prisma.car.findUnique({ where: { id: Number(carId) } });
    if (!newCar || newCar.driverId !== userId) return res.status(400).json({ error: 'Invalid car' });

    // 3. Check Capacity
    // Current passengers vs New Car Capacity (minus driver)
    const currentPassengerCount = offer.allocations.length;
    const newAvailableSeats = newCar.seatCapacity - 1; // Driver takes 1

    if (currentPassengerCount > newAvailableSeats && !force) {
        return res.status(409).json({ 
            error: 'New car is too small for assigned passengers',
            code: 'CAPACITY_WARNING',
            currentPassengers: currentPassengerCount,
            newCapacity: newCar.seatCapacity
        });
    }

    // 4. Update (and cleanse if forced)
    await prisma.$transaction(async (tx) => {
        if (currentPassengerCount > newAvailableSeats && force) {
            // Remove all passengers
            await tx.passengerAllocation.deleteMany({
                where: { liftOfferId: offerId }
            });
            
            // Reset requests to PENDING
            const passengerIds = offer.allocations.map(a => a.passengerId);
            if (passengerIds.length > 0) {
                await tx.liftRequest.updateMany({
                    where: { 
                        eventId: offer.eventId, 
                        date: offer.date,
                        passengerId: { in: passengerIds }
                    },
                    data: { status: 'PENDING' }
                });
            }
        }

        // Update Offer
        await tx.liftOffer.update({
            where: { id: offerId },
            data: {
                carId: Number(carId),
                availableSeats: newAvailableSeats // Reset available seats to max of new car
            }
        });
    });

    return res.json({ ok: true });

  } catch (err) {
    console.error('Error updating lift offer car:', err);
    return res.status(500).json({ error: 'Failed to update car' });
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
