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
      orderBy: { rank: 'asc' },
    });

    res.json(addresses.map((a) => ({ ...a.address, rank: a.rank })));
  } catch (error) {
    console.error('Error fetching addresses:', error);
    res.status(500).json({ error: 'Error fetching addresses' });
  }
};

export const addAddress = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { street, city, province, postalCode, country } = req.body;

    // Create the address
    const newAddress = await prisma.address.create({
      data: {
        street,
        city,
        province,
        postalCode,
        country,
      },
    });

    // Link it to the user
    await prisma.addressList.create({
      data: {
        userId,
        addressId: newAddress.id,
        rank: 1, // Default rank, logic to adjust can be added later
      },
    });

    res.status(201).json(newAddress);
  } catch (error) {
    console.error('Error adding address:', error);
    res.status(500).json({ error: 'Error adding address' });
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

    res.json({ message: 'Address removed' });
  } catch (error) {
    console.error('Error deleting address:', error);
    res.status(500).json({ error: 'Error deleting address' });
  }
};
