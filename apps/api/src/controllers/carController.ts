import { Request, Response } from 'express';
import { prisma } from '@repo/database';

export const getCars = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });

    const cars = await prisma.car.findMany({
      where: { driverId: userId },
    });

    return res.json({ cars });
  } catch (err) {
    console.error('Error fetching cars:', err);
    return res.status(500).json({ error: 'Failed to fetch cars' });
  }
};

export const createCar = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });

    const { make, model, year, licensePlate, color, seatCapacity } = req.body;

    if (!make || !model || !year || !licensePlate || !color || !seatCapacity) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Ensure the user is registered as a Driver
    // We use upsert to ensure it exists without failing if it already does
    // However, Driver model only has ID (relation to User).
    // If User doesn't have a Driver record, we create one.
    
    // First, verify if Driver record exists
    const driver = await prisma.driver.findUnique({ where: { id: userId } });
    if (!driver) {
      await prisma.driver.create({ data: { id: userId } });
      // Also ensure the User flag is set
      await prisma.user.update({
        where: { id: userId },
        data: { isDriver: true },
      });
    }

    const car = await prisma.car.create({
      data: {
        driverId: userId,
        make,
        model,
        year: parseInt(year),
        licensePlate,
        color,
        seatCapacity: parseInt(seatCapacity),
      },
    });

    return res.json({ car });
  } catch (err) {
    console.error('Error creating car:', err);
    return res.status(500).json({ error: 'Failed to create car' });
  }
};

export const updateCar = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const carId = parseInt(req.params.id);

    if (isNaN(carId)) return res.status(400).json({ error: 'Invalid car ID' });

    const { make, model, year, licensePlate, color, seatCapacity } = req.body;

    const existingCar = await prisma.car.findUnique({ where: { id: carId } });
    if (!existingCar) return res.status(404).json({ error: 'Car not found' });

    if (existingCar.driverId !== userId) {
      return res.status(403).json({ error: 'Not authorized to update this car' });
    }

    const car = await prisma.car.update({
      where: { id: carId },
      data: {
        make,
        model,
        year: year ? parseInt(year) : undefined,
        licensePlate,
        color,
        seatCapacity: seatCapacity ? parseInt(seatCapacity) : undefined,
      },
    });

    return res.json({ car });
  } catch (err) {
    console.error('Error updating car:', err);
    return res.status(500).json({ error: 'Failed to update car' });
  }
};

export const deleteCar = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const carId = parseInt(req.params.id);

    if (isNaN(carId)) return res.status(400).json({ error: 'Invalid car ID' });

    const existingCar = await prisma.car.findUnique({ where: { id: carId } });
    if (!existingCar) return res.status(404).json({ error: 'Car not found' });

    if (existingCar.driverId !== userId) {
      return res.status(403).json({ error: 'Not authorized to delete this car' });
    }

    // Check for active lift offers associated with this car
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const activeOffers = await prisma.liftOffer.findFirst({
      where: {
        carId: carId,
        date: {
          gte: today,
        },
      },
    });

    if (activeOffers) {
      return res.status(400).json({ error: 'Cannot delete car. It is assigned to upcoming lift offers.' });
    }

    await prisma.car.delete({ where: { id: carId } });

    return res.json({ ok: true });
  } catch (err) {
    console.error('Error deleting car:', err);
    return res.status(500).json({ error: 'Failed to delete car' });
  }
};

export const setDefaultCar = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const carId = parseInt(req.params.id);
    const { updateFutureOffers } = req.body;

    if (!userId) return res.status(401).json({ error: 'Not authenticated' });
    if (isNaN(carId)) return res.status(400).json({ error: 'Invalid car ID' });

    // Verify ownership
    const newDefaultCar = await prisma.car.findUnique({ where: { id: carId } });
    if (!newDefaultCar) return res.status(404).json({ error: 'Car not found' });
    if (newDefaultCar.driverId !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Check for future offers using a DIFFERENT car
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    const futureOffers = await prisma.liftOffer.findMany({
        where: {
            driverId: userId,
            date: { gte: now },
            carId: { not: carId } // Offers NOT using the new default
        },
        include: { allocations: true }
    });

    if (futureOffers.length > 0 && updateFutureOffers === undefined) {
        return res.status(409).json({
            error: 'You have upcoming lift offers using a different car.',
            code: 'FUTURE_OFFERS_WARNING',
            count: futureOffers.length
        });
    }

    // Transaction to update flags and optionally offers
    await prisma.$transaction(async (tx) => {
      // 1. Unset default for all user's cars
      await tx.car.updateMany({
        where: { driverId: userId },
        data: { isDefault: false },
      });
      
      // 2. Set new default
      await tx.car.update({
        where: { id: carId },
        data: { isDefault: true },
      });

      // 3. Update future offers if requested
      if (updateFutureOffers && futureOffers.length > 0) {
          for (const offer of futureOffers) {
              const currentPassengerCount = offer.allocations.length;
              const newAvailableSeats = newDefaultCar.seatCapacity - 1;

              // Handle Capacity: Remove passengers if too small
              if (currentPassengerCount > newAvailableSeats) {
                  // Remove passengers
                  await tx.passengerAllocation.deleteMany({
                      where: { liftOfferId: offer.id }
                  });
                  // Reset requests
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

              // Update the offer
              await tx.liftOffer.update({
                  where: { id: offer.id },
                  data: {
                      carId: carId,
                      availableSeats: newAvailableSeats
                  }
              });
          }
      }
    });

    return res.json({ ok: true });
  } catch (err) {
    console.error('Error setting default car:', err);
    return res.status(500).json({ error: 'Failed to set default car' });
  }
};