/**
 * Dev utility: creates (or refreshes) an Admin record for the seeded demo
 * account so the same credentials ALSO work on the admin portal.
 *
 *   Admin portal  (/admin/login): demo@avan.events / Customer@123
 *   Customer site (/login):       demo@avan.events / Customer@123
 *
 * Admins and customers are separate collections, so the two logins stay
 * independent. Re-run with: npx tsx scripts/create-demo-admin.ts
 */
import { PrismaClient, Role } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  const email = 'demo@avan.events';

  // Same argon2 parameters as prisma/seed.ts
  const passwordHash = await argon2.hash('Customer@123', {
    type: argon2.argon2id,
    memoryCost: 2 ** 16,
    timeCost: 3,
    parallelism: 1,
  });

  const admin = await prisma.admin.upsert({
    where: { email },
    update: { passwordHash, isActive: true },
    create: {
      email,
      passwordHash,
      name: 'Suhas Reddy',
      role: Role.ADMIN,
      isActive: true,
    },
  });

  console.log(`✅ Admin ready: ${admin.email} (${admin.role})`);
}

main()
  .catch((e) => {
    console.error('❌ Failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
