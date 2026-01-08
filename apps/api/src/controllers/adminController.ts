import { Request, Response } from 'express';
import { prisma } from '@repo/database';

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const [userCount, upcomingEventCount, activeLiftOffers, pendingLiftRequests] = await Promise.all([
      prisma.user.count(),
      prisma.event.count({
        where: {
          date: {
            gte: new Date(),
          },
        },
      }),
      prisma.liftOffer.count({
        where: {
          date: {
            gte: new Date(),
          },
        },
      }),
      prisma.liftRequest.count({
        where: {
          status: 'PENDING',
        },
      }),
    ]);

    res.json({
      userCount,
      upcomingEventCount,
      activeLiftOffers,
      pendingLiftRequests,
    });
  } catch (error) {
    console.error('Error fetching admin dashboard stats:', error);
    res.status(500).json({ error: 'Error fetching dashboard stats' });
  }
};

// Address / Pickup Point Management
export const getPickups = async (req: Request, res: Response) => {
  try {
    const pickups = await prisma.pickup.findMany({
      include: {
        address: true,
      },
      orderBy: {
        time: 'asc',
      },
    });
    res.json(pickups);
  } catch (error) {
    console.error('Error fetching pickups:', error);
    res.status(500).json({ error: 'Error fetching pickups' });
  }
};

export const createPickup = async (req: Request, res: Response) => {
  try {
    const { time, nickname, street, city, province, postalCode, country, link, latitude, longitude } = req.body;

    // Use a transaction to ensure both Address and Pickup are created or neither
    const newPickup = await prisma.$transaction(async (prisma) => {
      const address = await prisma.address.create({
        data: {
          nickname,
          street,
          city,
          province,
          postalCode,
          country,
          link,
          latitude,
          longitude,
        },
      });

      const pickup = await prisma.pickup.create({
        data: {
          time: new Date(time), // Ensure time is a Date object
          addressId: address.id,
          passengerCount: 1, // Default to 1 or passed from body if needed
        },
        include: {
          address: true,
        },
      });

      return pickup;
    });

    res.status(201).json(newPickup);
  } catch (error) {
    console.error('Error creating pickup:', error);
    res.status(500).json({ error: 'Error creating pickup' });
  }
};

export const updatePickup = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { time, nickname, street, city, province, postalCode, country, link, latitude, longitude } = req.body;

    const updatedPickup = await prisma.$transaction(async (prisma) => {
      // 1. Get current pickup to find addressId
      const currentPickup = await prisma.pickup.findUnique({
        where: { id },
      });

      if (!currentPickup) {
        throw new Error('Pickup not found');
      }

      // 2. Update Address
      await prisma.address.update({
        where: { id: currentPickup.addressId },
        data: {
          nickname,
          street,
          city,
          province,
          postalCode,
          country,
          link,
          latitude,
          longitude,
        },
      });

      // 3. Update Pickup Time
      const pickup = await prisma.pickup.update({
        where: { id },
        data: {
          time: new Date(time),
        },
        include: {
          address: true,
        },
      });

      return pickup;
    });

    res.json(updatedPickup);
  } catch (error) {
    console.error('Error updating pickup:', error);
    if (error instanceof Error && error.message === 'Pickup not found') {
      res.status(404).json({ error: 'Pickup not found' });
    } else {
      res.status(500).json({ error: 'Error updating pickup' });
    }
  }
};

export const deletePickup = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);

    // Check usage in allocations? 
    // If we want to block deletion if passengers are allocated:
    const allocationCount = await prisma.passengerAllocation.count({ where: { pickupId: id } });
    if (allocationCount > 0) {
       return res.status(409).json({ error: 'Pickup is currently in use by passenger allocations.' });
    }

    await prisma.pickup.delete({
      where: { id },
    });

    res.json({ message: 'Pickup deleted successfully' });
  } catch (error) {
    console.error('Error deleting pickup:', error);
    res.status(500).json({ error: 'Error deleting pickup' });
  }
};