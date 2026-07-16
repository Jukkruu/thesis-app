import { PrismaClient } from '@/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

function createClient() {
  // Keep the per-instance pool tiny and drop idle connections fast — Vercel runs
  // many instances in parallel and the Supabase pooler has a global client limit
  // (hit EMAXCONNSESSION with the default pg pool of 10 per instance).
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
    max: 3,
    idleTimeoutMillis: 30_000,
  })
  return new PrismaClient({ adapter })
}

// Cache on globalThis so the same container reuses one connection pool
// (works in both dev and Vercel serverless — fixes connection exhaustion)
export const prisma = globalForPrisma.prisma ?? createClient()
globalForPrisma.prisma = prisma
