import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

// TODO: Migrate from local SQLite to Turso for production.
// Turso gives edge replication, automatic backups, and a generous free tier (9 GB).
// Steps: 1) Create Turso DB  2) Set DATABASE_URL=libsql://your-db.turso.io?authToken=...
// The PrismaLibSql adapter already supports Turso — no code changes needed, only env var.

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const url = process.env.DATABASE_URL || "file:./prisma/dev.db";

  const adapter = new PrismaLibSql({ url });

  return new PrismaClient({ adapter }) as unknown as PrismaClient;
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
