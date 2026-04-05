import { PrismaClient } from "@prisma/client";

// In development, setting Prisma on the global object prevents
// exhausting database connections by repeatedly instantiating PrismaClient
// during hot reloads (nodemon).
const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
