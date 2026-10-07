import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { taalimPrisma?: PrismaClient };

export function getPrismaClient(): PrismaClient {
  if (globalForPrisma.taalimPrisma) return globalForPrisma.taalimPrisma;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is required to connect to PostgreSQL");
  const adapter = new PrismaPg({ connectionString });
  const client = new PrismaClient({ adapter });
  if (process.env.NODE_ENV !== "production") globalForPrisma.taalimPrisma = client;
  return client;
}
