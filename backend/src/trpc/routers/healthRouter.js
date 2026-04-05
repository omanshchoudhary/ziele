import { createTRPCRouter, publicProcedure } from "../trpc.js";
import { getServiceReadinessSnapshot } from "../../config/env.js";

export const healthRouter = createTRPCRouter({
  status: publicProcedure.query(() => ({
    status: "ok",
    framework: "Express + tRPC",
    services: getServiceReadinessSnapshot(),
  })),
});
