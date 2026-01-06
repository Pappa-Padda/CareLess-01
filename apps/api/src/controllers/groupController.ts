import { Request, Response } from 'express';
import { prisma } from '@repo/database';

export const getGroups = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const adminOnly = req.query.adminOnly === 'true';
    const skip = (page - 1) * limit;

    if (!userId) return res.status(401).json({ error: 'Not authenticated' });

    const whereClause: any = {
      userGroupAssociation: {
        some: {
          userId: userId,
          ...(adminOnly && { isAdmin: true }),
        },
      },
    };

    const groups = await prisma.group.findMany({
      where: whereClause,
      include: {
        userGroupAssociation: {
          where: { userId },
          select: { isAdmin: true },
        },
      },
      skip,
      take: limit,
      orderBy: {
        name: 'asc',
      },
    });

    const total = await prisma.group.count({
      where: whereClause,
    });

    const formattedGroups = groups.map((g) => ({
      id: g.id,
      name: g.name,
      description: g.description,
      profilePicture: g.profilePicture,
      createdAt: g.createdAt,
      lastUpdated: g.lastUpdated,
      isAdmin: g.userGroupAssociation[0]?.isAdmin || false,
    }));

    return res.json({ groups: formattedGroups, total, page, limit });
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

export const leaveGroup = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { groupId } = req.body;
    const gid = Number(groupId);

    if (!userId) return res.status(401).json({ error: 'Not authenticated' });
    if (!groupId) return res.status(400).json({ error: 'Group ID is required' });

    await prisma.$transaction(async (tx) => {
      // Check if association exists
      const existing = await tx.userGroupAssociation.findUnique({
        where: {
          userId_groupId: {
            userId,
            groupId: gid,
          },
        },
      });

      if (!existing) {
        throw new Error('NOT_MEMBER');
      }

      // If leaving user is an admin
      if (existing.isAdmin) {
        // Check if there are other admins
        const otherAdmins = await tx.userGroupAssociation.findFirst({
          where: {
            groupId: gid,
            userId: { not: userId },
            isAdmin: true,
          },
        });

        // If no other admins, find the next member to promote
        if (!otherAdmins) {
          const nextMember = await tx.userGroupAssociation.findFirst({
            where: {
              groupId: gid,
              userId: { not: userId },
            },
            orderBy: {
              userId: 'asc', // Simple fallback ordering
            },
          });

          if (nextMember) {
            await tx.userGroupAssociation.update({
              where: {
                userId_groupId: {
                  userId: nextMember.userId,
                  groupId: gid,
                },
              },
              data: { isAdmin: true },
            });
          }
        }
      }

      // Delete the association
      await tx.userGroupAssociation.delete({
        where: {
          userId_groupId: {
            userId,
            groupId: gid,
          },
        },
      });
    });

    return res.json({ ok: true });
  } catch (err: any) {
    if (err.message === 'NOT_MEMBER') {
      return res.status(404).json({ error: 'Not a member of this group' });
    }
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
};

export const getGroupMembers = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const groupId = Number(req.params.id);

    if (!userId) return res.status(401).json({ error: 'Not authenticated' });
    if (isNaN(groupId)) return res.status(400).json({ error: 'Invalid group ID' });

    // Verify requesting user is a member
    const membership = await prisma.userGroupAssociation.findUnique({
      where: {
        userId_groupId: { userId, groupId },
      },
    });

    if (!membership) return res.status(403).json({ error: 'Not a member of this group' });

    const members = await prisma.userGroupAssociation.findMany({
      where: { groupId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            profilePicture: true,
            isDriver: true,
            phoneNumber: true,
          },
        },
      },
      orderBy: [
        { isAdmin: 'desc' }, // Admins first
        { user: { name: 'asc' } },
      ],
    });

    const formattedMembers = members.map((m) => ({
      userId: m.userId,
      name: m.user.name,
      profilePicture: m.user.profilePicture,
      isDriver: m.user.isDriver,
      phoneNumber: m.user.phoneNumber,
      isAdmin: m.isAdmin,
    }));

    return res.json({ members: formattedMembers });
  } catch (err) {
    console.error('Error fetching group members:', err);
    return res.status(500).json({ error: 'Failed to fetch members' });
  }
};

export const updateGroup = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { id } = req.params;
    const { name, description } = req.body;
    let profilePicture = req.body.profilePicture;

    if (!userId) return res.status(401).json({ error: 'Not authenticated' });
    if (!id) return res.status(400).json({ error: 'Group ID is required' });

    // Verify admin status
    const membership = await prisma.userGroupAssociation.findUnique({
      where: {
        userId_groupId: {
          userId,
          groupId: Number(id),
        },
      },
    });

    if (!membership || !membership.isAdmin) {
      return res.status(403).json({ error: 'Not authorized to update this group' });
    }

    if ((req as any).file) {
      const file = (req as any).file;
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      profilePicture = `${apiUrl}/uploads/${file.filename}`;
    }

    const updatedGroup = await prisma.group.update({
      where: { id: Number(id) },
      data: {
        name,
        description,
        ...(profilePicture && { profilePicture }),
      },
    });

    return res.json({ group: updatedGroup });
  } catch (err) {
    console.error('Error updating group:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};