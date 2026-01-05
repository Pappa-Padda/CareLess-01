import { Request, Response } from 'express';
import { prisma } from '@repo/database';

export const getGroups = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    if (!userId) return res.status(401).json({ error: 'Not authenticated' });

    const groups = await prisma.group.findMany({
      where: {
        userGroupAssociation: {
          some: {
            userId: userId,
          },
        },
      },
      skip,
      take: limit,
      orderBy: {
        name: 'asc',
      },
    });

    const total = await prisma.group.count({
      where: {
        userGroupAssociation: {
          some: {
            userId: userId,
          },
        },
      },
    });

    return res.json({ groups, total, page, limit });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
};

export const createGroup = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { name, description } = req.body;
    let profilePicture = req.body.profilePicture;

    if (!userId) return res.status(401).json({ error: 'Not authenticated' });
    if (!name) return res.status(400).json({ error: 'Name is required' });

    if ((req as any).file) {
      const file = (req as any).file;
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      profilePicture = `${apiUrl}/uploads/${file.filename}`;
    } else if (!profilePicture) {
      // Default picture if none uploaded and none provided in body
      profilePicture = '/icons/icon-192x192.jpg';
    }

    const group = await prisma.group.create({
      data: {
        name,
        description,
        profilePicture: profilePicture || null,
        userGroupAssociation: {
          create: {
            userId,
            isAdmin: true,
          },
        },
      },
    });

    return res.json({ group });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
};

export const joinGroup = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { groupId } = req.body;

    if (!userId) return res.status(401).json({ error: 'Not authenticated' });
    if (!groupId) return res.status(400).json({ error: 'Group ID is required' });

    // Check if group exists
    const group = await prisma.group.findUnique({ where: { id: Number(groupId) } });
    if (!group) return res.status(404).json({ error: 'Group not found' });

    // Check if already a member
    const existing = await prisma.userGroupAssociation.findUnique({
      where: {
        userId_groupId: {
          userId,
          groupId: Number(groupId),
        },
      },
    });

    if (existing) return res.status(400).json({ error: 'Already a member' });

    await prisma.userGroupAssociation.create({
      data: {
        userId,
        groupId: Number(groupId),
      },
    });

    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
};
