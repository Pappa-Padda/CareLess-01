import { Request, Response } from 'express';
import { prisma } from '@repo/database';

export const getEvents = async (req: Request, res: Response) => {
  try {
    const events = await prisma.event.findMany({
      include: {
        address: true,
        group: true,
      },
      orderBy: {
        date: 'asc',
      },
    });
    res.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Error fetching events' });
  }
};

export const createEvent = async (req: Request, res: Response) => {
  try {
    const { name, description, date, startTime, endTime, groupId, address } = req.body;

    if (!groupId || !address) {
      return res.status(400).json({ error: 'Group ID and Address are required' });
    }

    // Convert date strings to Date objects if necessary (though Prisma handles ISO strings well)
    // Assuming frontend sends ISO strings for dates and times

    const newEvent = await prisma.event.create({
      data: {
        name,
        description,
        date: new Date(date),
        startTime: new Date(startTime), // Note: Prisma/MySQL Time type might need full Date object
        endTime: new Date(endTime),
        group: {
          connect: { id: Number(groupId) },
        },
        address: {
          create: {
            street: address.street,
            city: address.city,
            province: address.province,
            postalCode: address.postalCode,
            country: address.country,
            latitude: address.latitude,
            longitude: address.longitude,
          },
        },
      },
      include: {
        address: true,
        group: true,
      },
    });

    res.status(201).json(newEvent);
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ error: 'Error creating event' });
  }
};

export const updateEvent = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, description, date, startTime, endTime, address } = req.body;

  try {
    const updatedEvent = await prisma.event.update({
      where: { id: Number(id) },
      data: {
        name,
        description,
        date: date ? new Date(date) : undefined,
        startTime: startTime ? new Date(startTime) : undefined,
        endTime: endTime ? new Date(endTime) : undefined,
        // Update address if provided
        address: address
          ? {
              update: {
                street: address.street,
                city: address.city,
                province: address.province,
                postalCode: address.postalCode,
                country: address.country,
                latitude: address.latitude,
                longitude: address.longitude,
              },
            }
          : undefined,
      },
      include: {
        address: true,
      },
    });

    res.json(updatedEvent);
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ error: 'Error updating event' });
  }
};

export const deleteEvent = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    await prisma.event.delete({
      where: { id: Number(id) },
    });
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ error: 'Error deleting event' });
  }
};
