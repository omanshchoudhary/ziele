import express from 'express';
import { z } from "zod";
import {
  getAnalytics,
  getCommunities,
  getDiscover,
  getRecommendations,
  getSidebar,
  getTrending,
} from "../controllers/metaController.js";
import { optionalAuth } from "../middleware/authMiddleware.js";
import { validateQuery } from "../middleware/validateRequest.js";

const router = express.Router();
const discoverQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  tag: z.string().trim().max(240).optional(),
});
const listQuerySchema = discoverQuerySchema.extend({
  limit: z.coerce.number().int().min(1).max(50).optional(),
});
const analyticsQuerySchema = z.object({
  range: z.coerce.number().int().optional(),
});

router.get("/sidebar", optionalAuth, getSidebar);
router.get("/discover", optionalAuth, validateQuery(discoverQuerySchema), getDiscover);
router.get(
  "/recommendations",
  optionalAuth,
  validateQuery(listQuerySchema),
  getRecommendations,
);
router.get("/trending", optionalAuth, validateQuery(listQuerySchema), getTrending);
router.get(
  "/communities",
  optionalAuth,
  validateQuery(discoverQuerySchema),
  getCommunities,
);
router.get("/analytics", optionalAuth, validateQuery(analyticsQuerySchema), getAnalytics);

export default router;
