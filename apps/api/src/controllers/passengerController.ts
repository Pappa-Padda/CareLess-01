import { Request, Response } from 'express';
import { prisma } from '@repo/database';

export const getDashboard = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    // 1. Fetch Allocations (Assigned Rides)
    const allocations = await prisma.passengerAllocation.findMany({
      where: {
        passengerId: userId,
        liftOffer: {
          event: {
            date: {
              gte: now,
            },
          },
        },
      },
      include: {
        pickup: {
            include: {
                address: true
            }
        },
        liftOffer: {
          include: {
            event: {
                include: {
                    address: true,
                    group: {
                        select: { name: true, profilePicture: true }
                    }
                }
            },
            driver: {
              include: {
                user: {
                  select: { name: true, phoneNumber: true, profilePicture: true },
                },
              },
            },
            car: true,
          },
        },
      },
    });

    // 2. Fetch Requests (Pending)
    // Only fetch requests where we don't already have an allocation for that event/date?
    // Or just fetch all and merge? The unique constraint prevents [passengerId, eventId, date] overlap in theory?
    // Let's fetch 'PENDING' requests.
    const requests = await prisma.liftRequest.findMany({
      where: {
        passengerId: userId,
        status: 'PENDING',
        event: {
            date: {
                gte: now
            }
        }
      },
      include: {
        event: {
            include: {
                address: true,
                group: {
                    select: { name: true, profilePicture: true }
                }
            }
        },
      },
    });

    // 3. Transform to Dashboard Items
    const dashboardItems = [];

    // Map Allocations
    for (const alloc of allocations) {
      dashboardItems.push({
        type: 'allocation',
        id: `alloc_${alloc.liftOfferId}_${alloc.passengerId}`,
        event: alloc.liftOffer.event,
        allocationId: alloc.liftOfferId, // Composite key part 1
        driver: alloc.liftOffer.driver.user,
        car: alloc.liftOffer.car,
        pickup: alloc.pickup,
        isConfirmed: alloc.isConfirmed,
        status: alloc.isConfirmed ? 'CONFIRMED' : 'ASSIGNED',
        date: alloc.liftOffer.date, // Use offer specific date
      });
    }

    // Map Requests
    for (const req of requests) {
      // Check if we already have an allocation for this event?
      // (Optimization: In a real app, backend might auto-delete request upon allocation)
      const hasAlloc = allocations.some(a => a.liftOffer.eventId === req.eventId && a.liftOffer.date.getTime() === req.date.getTime());
      if (!hasAlloc) {
        dashboardItems.push({
          type: 'request',
          id: `req_${req.id}`,
          event: req.event,
          requestId: req.id,
          status: 'PENDING',
          date: req.date, // Use request specific date
        });
      }
    }

    // Sort by Date
    dashboardItems.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    res.json({ rides: dashboardItems });
  } catch (error) {
    console.error('Error fetching passenger dashboard:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard' });
  }
};

export const confirmAllocation = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { liftOfferId } = req.body; // We need liftOfferId to identify the composite key

    if (!userId) return res.status(401).json({ error: 'Not authenticated' });
    if (!liftOfferId) return res.status(400).json({ error: 'Lift Offer ID is required' });

    await prisma.passengerAllocation.update({
      where: {
        liftOfferId_passengerId: {
          liftOfferId: Number(liftOfferId),
          passengerId: userId,
        },
      },
      data: {
        isConfirmed: true,
      },
    });

    res.json({ ok: true });
  } catch (error) {
    console.error('Error confirming allocation:', error);
    res.status(500).json({ error: 'Failed to confirm seat' });
  }
};

export const declineAllocation = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.userId;
      const { liftOfferId } = req.body; 
  
      if (!userId) return res.status(401).json({ error: 'Not authenticated' });
      if (!liftOfferId) return res.status(400).json({ error: 'Lift Offer ID is required' });
  
      await prisma.passengerAllocation.delete({
        where: {
          liftOfferId_passengerId: {
            liftOfferId: Number(liftOfferId),
            passengerId: userId,
          },
        },
      });
  
      // Optionally: Re-open the request? Or create a new PENDING request?
      // For now, just delete allocation.
  
      res.json({ ok: true });
    } catch (error) {
      console.error('Error declining allocation:', error);
      res.status(500).json({ error: 'Failed to decline seat' });
    }
  };
