import { PrismaClient } from '@prisma/client'

// Ensure a single PrismaClient instance across hot reloads in development
const globalForPrisma = global as unknown as { prisma?: PrismaClient }

// Validate DATABASE_URL is present
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set')
}

export const prisma: PrismaClient =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: [
      { emit: 'event', level: 'query' },
      { emit: 'stdout', level: 'error' },
      { emit: 'stdout', level: 'warn' }
    ],
    errorFormat: 'pretty'
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// Query logging removed due to TypeScript issues
