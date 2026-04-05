import {
  factCheckContent,
  summarizeContent,
  translateContent,
} from "../utils/aiUtils.js";

export async function translatePostContent(req, res) {
  try {
    const payload = req.validatedBody || req.body || {};
    const result = await translateContent({
      text: payload.text || "",
      sourceLanguage: payload.sourceLanguage || "auto",
      targetLanguage: payload.targetLanguage || "English",
    });

    return res.json(result);
  } catch (error) {
    return res.status(500).json({
      error: error.message || "Failed to translate content.",
    });
  }
}

export async function summarizePostContent(req, res) {
  try {
    const payload = req.validatedBody || req.body || {};
    const result = await summarizeContent({
      title: payload.title || "",
      text: payload.text || "",
      targetLanguage: payload.targetLanguage || "English",
    });

    return res.json(result);
  } catch (error) {
    return res.status(500).json({
      error: error.message || "Failed to summarize content.",
    });
  }
}

export async function factCheckPostContent(req, res) {
  try {
    const payload = req.validatedBody || req.body || {};
    const result = await factCheckContent({
      title: payload.title || "",
      text: payload.text || "",
      tags: payload.tags || [],
    });

    return res.json(result);
  } catch (error) {
    return res.status(500).json({
      error: error.message || "Failed to review content.",
    });
  }
}
