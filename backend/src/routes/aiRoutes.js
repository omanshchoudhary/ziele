import express from "express";
import {
  factCheckPostContent,
  summarizePostContent,
  translatePostContent,
} from "../controllers/aiController.js";
import { createRateLimiter } from "../middleware/rateLimitMiddleware.js";
import { validateBody } from "../middleware/validateRequest.js";
import {
  aiFactCheckSchema,
  aiSummarizeSchema,
  aiTranslateSchema,
} from "../validation/contentSchemas.js";

const router = express.Router();
const aiLimiter = createRateLimiter({
  keyPrefix: "ai:requests",
  limit: 20,
  windowMs: 10 * 60_000,
  message: "AI request limit reached. Please try again shortly.",
});

// These endpoints stay public so readers can translate and summarize posts
// without signing in, while authors can also use them during drafting.
router.post("/translate", aiLimiter, validateBody(aiTranslateSchema), translatePostContent);
router.post("/summarize", aiLimiter, validateBody(aiSummarizeSchema), summarizePostContent);
router.post("/fact-check", aiLimiter, validateBody(aiFactCheckSchema), factCheckPostContent);

export default router;
