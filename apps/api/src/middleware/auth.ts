import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable is not defined.');
}

export interface AuthPayload {
  userId: number;
  role: string;
  iat?: number;
  exp?: number;
}

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const token = (req as any).cookies?.token || req.cookies?.token;
  if (!token) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const payload = jwt.verify(token, JWT_SECRET) as AuthPayload;
    (req as any).user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user as AuthPayload | undefined;
  if (!user) return res.status(401).json({ error: 'Not authenticated' });
  if (user.role !== 'ADMIN') return res.status(403).json({ error: 'Admin required' });
  next();
};
