import { Request, Response } from 'express';
import { prisma } from '@repo/database';

export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany();
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Error fetching users' });
  }
};

export const createUser = async (req: Request, res: Response) => {
  try {
    const { phoneNumber, name } = req.body;

    const newUser = await prisma.user.create({
      data: {
        phoneNumber,
        name,
      },
    });

    res.status(201).json(newUser);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Error creating user' });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { name, phoneNumber } = req.body;
    const profilePicture = req.file ? `/uploads/${req.file.filename}` : undefined;

    const dataToUpdate: any = { name, phoneNumber };
    if (profilePicture) {
      dataToUpdate.profilePicture = profilePicture;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: dataToUpdate,
    });

    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Error updating profile' });
  }
};

export const getAddresses = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const addresses = await prisma.addressList.findMany({
      where: { userId },
      include: { address: true },
      orderBy: { isDefault: 'desc' }, // Show default first
    });

    res.json(addresses.map((a) => ({ ...a.address, rank: a.rank, isDefault: a.isDefault, nickname: a.address.nickname })));
  } catch (error) {
    console.error('Error fetching addresses:', error);
    res.status(500).json({ error: 'Error fetching addresses' });
  }
};

export const setDefaultAddress = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const addressId = parseInt(req.params.id);
    const { updateFuturePickups } = req.body;

    if (!userId) return res.status(401).json({ error: 'Not authenticated' });
    if (isNaN(addressId)) return res.status(400).json({ error: 'Invalid address ID' });

    // Verify ownership
    const addressEntry = await prisma.addressList.findUnique({
        where: { addressId_userId: { addressId, userId } }
    });

    if (!addressEntry) return res.status(404).json({ error: 'Address not found in your list' });

    // Find future allocations where pickup address is DIFFERENT
    const now = new Date();
    const futureAllocations = await prisma.passengerAllocation.findMany({
        where: {
            passengerId: userId,
            pickup: {
                time: { gte: now },
                addressId: { not: addressId }
            }
        },
        include: { pickup: true }
    });

    if (futureAllocations.length > 0 && updateFuturePickups === undefined) {
        return res.status(409).json({
            error: 'You have upcoming lifts with a different pickup address.',
            code: 'FUTURE_PICKUPS_WARNING',
            count: futureAllocations.length
        });
    }

    // Transaction
    await prisma.$transaction(async (tx) => {
        // 1. Unset default flags
        await tx.addressList.updateMany({
            where: { userId },
            data: { isDefault: false }
        });

        // 2. Set new default
        await tx.addressList.update({
            where: { addressId_userId: { addressId, userId } },
            data: { isDefault: true }
        });

        // 3. Update future pickups if requested
        if (updateFuturePickups && futureAllocations.length > 0) {
            const pickupIds = futureAllocations.map(a => a.pickupId);
            await tx.pickup.updateMany({
                where: { id: { in: pickupIds } },
                data: { addressId: addressId }
            });
        }
    });

    return res.json({ ok: true });
  } catch (err) {
    console.error('Error setting default address:', err);
    return res.status(500).json({ error: 'Failed to set default address' });
  }
};

export const addAddress = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { nickname, street, city, province, postalCode, country, link, latitude, longitude } = req.body;

    // Check if user has any addresses
    const existingAddressesCount = await prisma.addressList.count({
      where: { userId },
    });

    const isDefault = existingAddressesCount === 0;

    // Create the address
    const newAddress = await prisma.address.create({
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

    // Link it to the user
    await prisma.addressList.create({
      data: {
        userId,
        addressId: newAddress.id,
        rank: 1, // Default rank, logic to adjust can be added later
        isDefault,
      },
    });

    res.status(201).json(newAddress);
  } catch (error) {
    console.error('Error adding address:', error);
    res.status(500).json({ error: 'Error adding address' });
  }
};

export const updateAddress = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { id } = req.params;
    const { nickname, street, city, province, postalCode, country, link, latitude, longitude } = req.body;

    // Verify ownership via AddressList
    const addressListEntry = await prisma.addressList.findUnique({
      where: {
        addressId_userId: {
          addressId: Number(id),
          userId,
        },
      },
    });

    if (!addressListEntry) {
      return res.status(403).json({ error: 'Address not found or access denied' });
    }

    const updatedAddress = await prisma.address.update({
      where: { id: Number(id) },
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

    res.json(updatedAddress);
  } catch (error) {
    console.error('Error updating address:', error);
    res.status(500).json({ error: 'Error updating address' });
  }
};

export const deleteAddress = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { id } = req.params; // addressId

    await prisma.addressList.deleteMany({
      where: {
        userId,
        addressId: parseInt(id),
      },
    });

    // Check remaining addresses
    const remainingAddresses = await prisma.addressList.findMany({
        where: { userId },
    });

    if (remainingAddresses.length === 1) {
        await prisma.addressList.update({
            where: {
                addressId_userId: {
                    addressId: remainingAddresses[0].addressId,
                    userId
                }
            },
            data: { isDefault: true }
        });
    }

    res.json({ message: 'Address removed' });
  } catch (error) {
    console.error('Error deleting address:', error);
    res.status(500).json({ error: 'Error deleting address' });
  }
};
