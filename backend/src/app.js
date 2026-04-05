import express from "express";
import cors from "cors";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

import { env } from "./config/env.js";
import { clerkAuthMiddleware } from "./middleware/authMiddleware.js";

import healthRoutes from "./routes/healthRoutes.js";
import postRoutes from "./routes/postRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import commentRoutes from "./routes/commentRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import metaRoutes from "./routes/metaRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import jobRoutes from "./routes/jobRoutes.js";
import webhookRoutes from "./routes/webhookRoutes.js";
import { createTrpcContext } from "./trpc/context.js";
import { appRouter } from "./trpc/routers/_app.js";

const app = express();

// We keep CORS permissive in early setup, but prefer explicit origins once env values are added.
app.use(
  cors({
    origin:
      env.corsOrigins.length > 0 ? env.corsOrigins : true,
    credentials: true,
  }),
);

// Keep webhook route before auth/body middleware to preserve the raw body for verification.
app.use("/api/webhooks/clerk", webhookRoutes);

// Clerk middleware must be mounted early so downstream routes can read auth state.
app.use(clerkAuthMiddleware);

// JSON parser for regular API routes.
app.use(express.json());

// Main logical routes
app.use("/api/health", healthRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/profiles", profileRoutes);
app.use("/api/meta", metaRoutes);
app.use("/api/ai", aiRoutes);

// tRPC lives alongside the existing REST routes so we can migrate incrementally.
app.use(
  "/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext: createTrpcContext,
  }),
);

export default app;
