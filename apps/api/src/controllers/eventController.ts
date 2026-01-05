import { Request, Response } from 'express';
import { prisma } from '@repo/database';

export const getEvents = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });

    const baseEvents = await prisma.event.findMany({
      where: {
        group: {
          userGroupAssociation: {
            some: {
              userId: userId,
            },
          },
        },
      },
      include: {
        address: true,
        group: true,
      },
      orderBy: {
        date: 'asc',
      },
    });

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const expandedEvents: any[] = [];

    baseEvents.forEach((event) => {
      if (event.isRecurring) {
        // Generate next 20 occurrences
        for (let i = 0; i < 20; i++) {
          const occDate = new Date(event.date);
          occDate.setDate(occDate.getDate() + (i * 7));
          
          // Only include if it's today or in the future
          if (occDate >= now) {
            expandedEvents.push({
              ...event,
              id: `${event.id}_${occDate.toISOString().split('T')[0]}`, // Virtual ID
              realId: event.id,
              date: occDate,
              // Adjust startTime and endTime to the new date
              startTime: combineDateAndTime(occDate, event.startTime),
              endTime: combineDateAndTime(occDate, event.endTime),
            });
          }
        }
      } else if (new Date(event.date) >= now) {
        expandedEvents.push({
          ...event,
          realId: event.id,
        });
      }
    });

    // Sort all expanded events by date
    expandedEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    res.json(expandedEvents);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Error fetching events' });
  }
};

// Helper to keep times consistent when shifting dates
const combineDateAndTime = (date: Date, time: Date) => {
  const result = new Date(date);
  result.setHours(time.getHours());
  result.setMinutes(time.getMinutes());
  result.setSeconds(0);
  result.setMilliseconds(0);
  return result;
};

export const createEvent = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { name, description, date, startTime, endTime, groupId, address, isRecurring } = req.body;

    // Strict validation: Address and core fields are mandatory
    if (!name || !date || !startTime || !endTime || !groupId || !address) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!address.street || !address.city || !address.province || !address.postalCode || !address.country) {
      return res.status(400).json({ error: 'Incomplete address details' });
    }

    // Check if user is admin of the group
    const association = await prisma.userGroupAssociation.findUnique({
      where: {
        userId_groupId: {
          userId,
          groupId: Number(groupId),
        },
      },
    });

    if (!association || !association.isAdmin) {
      return res.status(403).json({ error: 'Only group admins can create events' });
    }

    const newEvent = await prisma.event.create({
      data: {
        name,
        description,
        date: new Date(date),
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        isRecurring: !!isRecurring, // Ensure strict boolean (true/false)
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
            link: address.link,
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
  try {
    const userId = (req as any).user?.userId;
    const { id } = req.params;
    const { name, description, date, startTime, endTime, address, isRecurring } = req.body;

    // Fetch event to check ownership/group
    const event = await prisma.event.findUnique({
      where: { id: Number(id) },
      include: { group: true },
    });

    if (!event) return res.status(404).json({ error: 'Event found' });

    // Check if user is admin of the group
    const association = await prisma.userGroupAssociation.findUnique({
      where: {
        userId_groupId: {
          userId,
          groupId: event.groupId,
        },
      },
    });

    if (!association || !association.isAdmin) {
      return res.status(403).json({ error: 'Only group admins can update events' });
    }

    // Address is mandatory for an event to be scheduled/updated
    if (!address) {
      return res.status(400).json({ error: 'Address details are required' });
    }

    const updatedEvent = await prisma.event.update({
      where: { id: Number(id) },
      data: {
        name,
        description,
        date: new Date(date),
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        isRecurring: !!isRecurring, // Strict boolean
        address: {
          update: {
            street: address.street,
            city: address.city,
            province: address.province,
            postalCode: address.postalCode,
            country: address.country,
            link: address.link,
            latitude: address.latitude,
            longitude: address.longitude,
          },
        },
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
  try {
    const userId = (req as any).user?.userId;
    const { id } = req.params;

    const event = await prisma.event.findUnique({
      where: { id: Number(id) },
    });

    if (!event) return res.status(404).json({ error: 'Event not found' });

    // Check if user is admin of the group
    const association = await prisma.userGroupAssociation.findUnique({
      where: {
        userId_groupId: {
          userId,
          groupId: event.groupId,
        },
      },
    });

    if (!association || !association.isAdmin) {
      return res.status(403).json({ error: 'Only group admins can delete events' });
    }

    await prisma.event.delete({
      where: { id: Number(id) },
    });
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ error: 'Error deleting event' });
  }
};

export const getEventById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.userId;

    const event = await prisma.event.findUnique({
      where: { id: Number(id) },
      include: {
        address: true,
        group: {
          include: {
            userGroupAssociation: {
              where: { userId },
            },
          },
        },
      },
    });

    if (!event) return res.status(404).json({ error: 'Event not found' });

    // Ensure user is part of the group to see details
    if (event.group.userGroupAssociation.length === 0) {
      return res.status(403).json({ error: 'Access denied. You are not a member of this group.' });
    }

    res.json(event);
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({ error: 'Error fetching event' });
  }
};
