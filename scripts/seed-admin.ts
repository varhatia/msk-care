import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@mskcare.com'
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@12345'

  const hashed = await bcrypt.hash(adminPassword, 12)

  // Upsert MSK Care admin (global admin without centerId)
  const user = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      // Ensure role remains ADMIN and approved if fields exist
      role: 'ADMIN',
      // @ts-ignore - optional fields may not exist in older schemas
      isApproved: true,
      // @ts-ignore
      approvedAt: new Date(),
      // @ts-ignore
      approvedBy: 'seed',
    },
    create: {
      email: adminEmail,
      password: hashed,
      role: 'ADMIN',
      // @ts-ignore - optional fields may not exist in older schemas
      isApproved: true,
      // @ts-ignore
      approvedAt: new Date(),
      // @ts-ignore
      approvedBy: 'seed',
    },
  })

  // eslint-disable-next-line no-console
  console.log('Seeded MSK Care admin:', { email: user.email, role: user.role })
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error('Seeding admin failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })


