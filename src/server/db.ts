import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: pg.Pool | undefined;
};

// Next.js loads .env automatically. During build and runtime,
// use DATABASE_URL (or DATABASE_URL_UNPOOLED) to initialize the adapter pool.
const connectionString = process.env.DATABASE_URL ?? process.env.DATABASE_URL_UNPOOLED;

if (!connectionString) {
  throw new Error("DATABASE_URL or DATABASE_URL_UNPOOLED must be configured in environment variables.");
}

// Keep the per-instance pool small. On Vercel every serverless instance owns
// its own pool; against Neon's connection limits a large max across many
// instances causes "too many connections" stalls under concurrent traffic.
// Small max + short idle timeout lets connections recycle quickly.
const pool =
  globalForPrisma.pool ??
  new pg.Pool({
    connectionString,
    max: Number(process.env.PG_POOL_MAX ?? 5),
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,
  });
const adapter = new PrismaPg(pool);

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.pool = pool;
}
