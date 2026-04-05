import { Resend } from "resend";
import { env, getServiceReadinessSnapshot } from "../config/env.js";

// This stays null until real credentials are provided, which keeps local boot simple.
export const resend =
  getServiceReadinessSnapshot().resend.configured
    ? new Resend(env.resend.apiKey)
    : null;
