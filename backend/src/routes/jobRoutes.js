import express from "express";
import { runReminderJob } from "../controllers/jobController.js";

const router = express.Router();

// This route is intentionally cron-friendly so a serverless scheduler can
// hit it on a cadence without needing browser auth. Protect it with the
// shared secret when you wire a real scheduler.
router.post("/reminders/send", runReminderJob);

export default router;
