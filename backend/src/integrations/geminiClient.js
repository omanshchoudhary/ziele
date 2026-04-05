import { GoogleGenerativeAI } from "@google/generative-ai";
import { env, getServiceReadinessSnapshot } from "../config/env.js";

export const geminiClient =
  getServiceReadinessSnapshot().gemini.configured
    ? new GoogleGenerativeAI(env.gemini.apiKey)
    : null;
