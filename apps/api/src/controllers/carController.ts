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

    const { make, model, year, licensePlate, seatCapacity } = req.body;

    if (!make || !model || !year || !licensePlate || !seatCapacity) {
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

    const { make, model, year, licensePlate, seatCapacity } = req.body;

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

    await prisma.car.delete({ where: { id: carId } });

    return res.json({ ok: true });
  } catch (err) {
    console.error('Error deleting car:', err);
    return res.status(500).json({ error: 'Failed to delete car' });
  }
};
