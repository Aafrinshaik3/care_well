import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as typeof globalThis & { carewellPrisma?: PrismaClient };

/** Returns null while DATABASE_URL is absent so local preview remains explicitly in demo mode. */
export function getPrismaClient() {
  if (!process.env.DATABASE_URL) return null;
  if (!globalForPrisma.carewellPrisma) globalForPrisma.carewellPrisma = new PrismaClient();
  return globalForPrisma.carewellPrisma;
}
