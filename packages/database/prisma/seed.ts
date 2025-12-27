import bcrypt from 'bcrypt';
import { prisma } from '../src/index.ts';

async function main() {
  const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || 'admin@example.com';
  const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'ChangeMe123!';
  const rounds = Number(process.env.BCRYPT_ROUNDS) || 10;

  const passwordHash = await bcrypt.hash(adminPassword, rounds);

  const existing = await prisma.user.findFirst({ where: { email: adminEmail } });
  let admin;
  if (existing) {
    admin = await prisma.user.update({
      where: { id: existing.id },
      data: { name: 'Admin', passwordHash, role: 'ADMIN' },
    });
  } else {
    admin = await prisma.user.create({
      data: {
        name: 'Admin',
        phoneNumber: '000-000-0000',
        email: adminEmail,
        passwordHash,
        role: 'ADMIN',
      },
    });
  }

  console.log('Ensured admin user:', admin.email, admin.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
