import "dotenv/config"

import { defineConfig } from "prisma/config"

// Prisma 7 no longer loads .env on its own, hence the `dotenv/config` import.
// `DATABASE_URL` is read directly instead of via `env()` so that commands which
// do not touch the database (notably the `postinstall` generate on a fresh
// clone or in CI) still work when it is unset.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
})
