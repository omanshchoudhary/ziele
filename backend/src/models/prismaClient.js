import prismaModule from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { env } from "../config/env.js";

const { PrismaClient } = prismaModule;
const { Pool } = pg;

const pool = new Pool({
  connectionString: env.database.url,
});

const adapter = new PrismaPg(pool);

// In development, setting Prisma on the global object prevents
// exhausting database connections by repeatedly instantiating PrismaClient
// during hot reloads (nodemon).
const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
