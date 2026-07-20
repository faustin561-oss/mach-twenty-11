import { PrismaClient } from "@prisma/client";

// Zero-config local database: if DATABASE_URL isn't set at all (no .env
// file, nothing exported), default to a local SQLite file rather than
// letting PrismaClient throw "environment variable not found". This is
// what makes `npm install && npm run dev` work with no setup — the whole
// database is one file at prisma/dev.db, created automatically on first
// use. Real deployments should still set a real DATABASE_URL explicitly
// (Postgres or otherwise) rather than relying on this default.
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "file:./dev.db";
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
