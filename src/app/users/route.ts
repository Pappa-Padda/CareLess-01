import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  // This runs on the server (backend), connects to MySQL, and returns JSON
  const users = await prisma.user.findMany();
  return NextResponse.json(users);
}