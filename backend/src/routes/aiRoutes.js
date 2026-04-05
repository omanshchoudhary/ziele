import express from "express";
import {
  factCheckPostContent,
  summarizePostContent,
  translatePostContent,
} from "../controllers/aiController.js";

const router = express.Router();

// These endpoints stay public so readers can translate and summarize posts
// without signing in, while authors can also use them during drafting.
router.post("/translate", translatePostContent);
router.post("/summarize", summarizePostContent);
router.post("/fact-check", factCheckPostContent);

export default router;
