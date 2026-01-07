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
