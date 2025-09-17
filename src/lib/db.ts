import { PrismaClient } from '@prisma/client'

// Ensure a single PrismaClient instance across hot reloads in development
const globalForPrisma = global as unknown as { prisma?: PrismaClient }

// Soft-check DATABASE_URL to avoid crashing at import time in serverless
if (!process.env.DATABASE_URL) {
  // eslint-disable-next-line no-console
  console.warn('DATABASE_URL is not set. Prisma may fail at first query.');
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
