import { PrismaPg } from "@prisma/adapter-pg"

import { PrismaClient } from "@/prisma/client/client"

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

function createPrismaClient() {
  const url = process.env.DATABASE_URL

  if (!url) {
    throw new Error("DATABASE_URL is not set")
  }

  // Prisma 7 dropped the bundled query engine: the connection is now owned by
  // the caller. Prisma Postgres/Accelerate speaks HTTP and takes `accelerateUrl`,
  // while a plain Postgres URL needs an explicit driver adapter.
  if (url.startsWith("prisma+postgres://")) {
    return new PrismaClient({ accelerateUrl: url })
  }

  // `?schema=` is a Prisma convention that `pg` parses into an inert config key,
  // so with a driver adapter the schema has to reach the adapter explicitly or
  // every query resolves against the default search_path instead.
  const schema = new URL(url).searchParams.get("schema") || undefined

  return new PrismaClient({
    // `pg` has no connect timeout by default; keep the pre-v7 behaviour.
    adapter: new PrismaPg(
      { connectionString: url, connectionTimeoutMillis: 5000 },
      schema ? { schema } : undefined,
    ),
  })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
