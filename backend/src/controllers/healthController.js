import { prisma } from "../models/prismaClient.js";
import { getServiceReadinessSnapshot } from "../config/env.js";
import { pingRedis } from "../integrations/redisClient.js";

export const checkHealth = (_req, res) => {
  res.json({
    status: "ok",
    message: "Backend is running with Express MVC + Prisma + tRPC scaffold",
    services: getServiceReadinessSnapshot(),
  });
};

export const checkReadiness = async (_req, res) => {
  const services = getServiceReadinessSnapshot();

  let database = {
    configured: services.database.configured,
    ok: false,
    message: "Database URL is missing.",
  };

  if (services.database.configured) {
    try {
      await prisma.$queryRawUnsafe("SELECT 1");
      database = {
        configured: true,
        ok: true,
        message: "Prisma reached PostgreSQL successfully.",
      };
    } catch (error) {
      database = {
        configured: true,
        ok: false,
        message: error instanceof Error ? error.message : "Database check failed.",
      };
    }
  }

  const redis = await pingRedis();
  const overallOk = database.ok && (!services.redis.configured || redis.ok);

  return res.status(overallOk ? 200 : 503).json({
    status: overallOk ? "ready" : "degraded",
    checks: {
      database,
      redis,
    },
    services,
  });
};
