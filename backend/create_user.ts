import dotenv from 'dotenv';
dotenv.config();

import prisma from './src/utils/prisma';
import bcrypt from 'bcrypt';

async function main() {
  const hash = await bcrypt.hash('manager123', 10);
  
  // Also create admin if it doesn't exist just in case
  const adminHash = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@watermark.com' },
    update: { passwordHash: adminHash },
    create: {
      email: 'admin@watermark.com',
      passwordHash: adminHash,
      name: 'System Administrator',
      role: 'ADMIN',
      department: 'ADMINISTRATION',
    },
  });

  await prisma.user.upsert({
    where: { email: 'manager@watermark.com' },
    update: { passwordHash: hash },
    create: {
      email: 'manager@watermark.com',
      passwordHash: hash,
      name: 'Store Manager',
      role: 'STORE_MANAGER',
      department: 'MANAGEMENT',
    },
  });

  console.log('Manager and Admin users created or updated successfully');
}

main().finally(() => process.exit(0));
