import { PrismaClient } from "@prisma/client";

// Standard Next.js dev-mode singleton — prevents exhausting Postgres
// connections from hot-reload creating a new PrismaClient on every save.
//
// In production on Vercel, this singleton only helps within a single
// warm serverless instance — it does NOT prevent connection exhaustion
// across many concurrent instances. That's what DATABASE_URL pointing at
// Neon's pooled (PgBouncer) connection string is for. See .env.example.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
