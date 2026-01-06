import { Request, Response } from 'express';
import { prisma } from '@repo/database';

export const getMyRequests = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });

    const requests = await prisma.liftRequest.findMany({
      where: { passengerId: userId },
    });

    return res.json({ requests });
  } catch (err) {
    console.error('Error fetching lift requests:', err);
    return res.status(500).json({ error: 'Failed to fetch requests' });
  }
};

export const createLiftRequest = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    console.log('Creating lift request for user:', userId, 'body:', req.body);
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });

    const { eventId, date } = req.body;
    if (!eventId || !date) return res.status(400).json({ error: 'Event ID and Date are required' });

    try {
        const request = await prisma.$transaction(async (tx) => {
            // 1. Ensure Passenger Profile Exists
            let passenger = await tx.passenger.findUnique({ where: { id: userId } });
            if (!passenger) {
                console.log('Creating new passenger profile for user:', userId);
                passenger = await tx.passenger.create({ data: { id: userId } });
                await tx.user.update({
                    where: { id: userId },
                    data: { isPassenger: true },
                });
            }

            // 2. Check for Existing Request
            const existingRequest = await tx.liftRequest.findUnique({
                where: {
                    passengerId_eventId_date: {
                        passengerId: userId,
                        eventId: Number(eventId),
                        date: new Date(date),
                    },
                },
            });

            if (existingRequest) {
                throw new Error('REQUEST_EXISTS');
            }

            // 3. Create Request
            return await tx.liftRequest.create({
                data: {
                    passengerId: userId,
                    eventId: Number(eventId),
                    date: new Date(date),
                    status: 'PENDING',
                },
            });
        });

        console.log('Lift request created:', request);
        return res.json({ request });

    } catch (txError: any) {
        if (txError.message === 'REQUEST_EXISTS') {
             console.log('Request already exists');
             return res.status(400).json({ error: 'Request already exists for this event' });
        }
        throw txError;
    }

  } catch (err) {
    console.error('Error creating lift request:', err);
    return res.status(500).json({ error: 'Failed to create request' });
  }
};

export const deleteLiftRequest = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const eventId = Number(req.params.eventId);
    const date = req.query.date as string;

    if (!userId) return res.status(401).json({ error: 'Not authenticated' });
    if (!eventId || !date) return res.status(400).json({ error: 'Event ID and Date are required' });

    // Use deleteMany to avoid error if it doesn't exist, or findUnique then delete
    // Since we have composite unique key:
    try {
        await prisma.liftRequest.delete({
            where: {
                passengerId_eventId_date: {
                    passengerId: userId,
                    eventId: eventId,
                    date: new Date(date),
                }
            }
        });
    } catch (e) {
        // If not found, ignore or return 404. For toggle behavior, idempotent delete is fine.
        return res.json({ ok: true }); 
    }

    return res.json({ ok: true });
  } catch (err) {
    console.error('Error deleting lift request:', err);
    return res.status(500).json({ error: 'Failed to delete request' });
  }
};
