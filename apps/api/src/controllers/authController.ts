import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '@repo/database';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';

export const signin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Missing credentials' });

    const user = await prisma.user.findFirst({ where: { email } });
    if (!user || !user.passwordHash) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.passwordHash as string);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });

    // Use a more robust production check
    const isProd = process.env.NODE_ENV === 'production' || process.env.RENDER === 'true';
    
    res.cookie('token', token, {
      httpOnly: true,
      secure: true, // Always true for cross-site cookies in modern browsers
      sameSite: 'none', // Required for Vercel -> Render communication
      maxAge: 1000 * 60 * 60,
      path: '/',
    });

    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
};

export const signup = async (req: Request, res: Response) => {
  try {
    const { name, email, password, phoneNumber } = req.body;

    if (!name || !email || !password || !phoneNumber) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        phoneNumber,
      },
    });

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });

    // Use a more robust production check
    const isProd = process.env.NODE_ENV === 'production' || process.env.RENDER === 'true';
    
    res.cookie('token', token, {
      httpOnly: true,
      secure: true, // Always true for cross-site cookies in modern browsers
      sameSite: 'none', // Required for Vercel -> Render communication
      maxAge: 1000 * 60 * 60,
      path: '/',
    });

    return res.json({ ok: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
};

export const signout = async (_req: Request, res: Response) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    path: '/',
  });
  res.json({ ok: true });
};

export const me = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true, phoneNumber: true, profilePicture: true, isDriver: true },
    });

    if (!user) return res.status(401).json({ error: 'User not found' });

    return res.json({ user });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
};

