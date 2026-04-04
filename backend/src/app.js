import express from "express";
import cors from "cors";

import { clerkAuthMiddleware } from "./middleware/authMiddleware.js";

import healthRoutes from "./routes/healthRoutes.js";
import postRoutes from "./routes/postRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import commentRoutes from "./routes/commentRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import metaRoutes from "./routes/metaRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import webhookRoutes from "./routes/webhookRoutes.js";

const app = express();

app.use(cors());

// Keep webhook route before auth/body middleware to preserve the raw body for verification.
app.use("/api/webhooks/clerk", webhookRoutes);

// Clerk middleware must be mounted early so downstream routes can read auth state.
app.use(clerkAuthMiddleware);

// JSON parser for regular API routes.
app.use(express.json());

// Main logical routes
app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/profiles", profileRoutes);
app.use("/api/meta", metaRoutes);

export default app;
