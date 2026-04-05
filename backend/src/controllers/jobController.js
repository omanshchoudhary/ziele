import { env } from "../config/env.js";
import { sendReminderBatch } from "../services/reminderService.js";

function isCronAuthorized(req) {
  if (!env.cron.sharedSecret) {
    return true;
  }

  return req.get("x-cron-secret") === env.cron.sharedSecret;
}

export async function runReminderJob(req, res) {
  if (!isCronAuthorized(req)) {
    return res.status(401).json({
      error: "Unauthorized cron request.",
    });
  }

  try {
    const result = await sendReminderBatch({
      limit: Number(req.body?.limit || req.query?.limit || 10),
    });

    return res.json({
      ok: true,
      ...result,
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message || "Failed to run reminder job.",
    });
  }
}

