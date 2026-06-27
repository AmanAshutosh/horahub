import { PrismaClient } from '@prisma/client';

/** True if DATABASE_URL is still the unchanged placeholder from .env.example. */
export function isDatabasePlaceholder(url: string | undefined): boolean {
  if (!url) return true;
  return /^postgresql:\/\/user:password@host\/db\b/.test(url);
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'] });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
