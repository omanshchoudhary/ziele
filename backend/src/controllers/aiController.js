import {
  factCheckContent,
  summarizeContent,
  translateContent,
} from "../utils/aiUtils.js";

export async function translatePostContent(req, res) {
  try {
    const result = await translateContent({
      text: req.body?.text || "",
      sourceLanguage: req.body?.sourceLanguage || "auto",
      targetLanguage: req.body?.targetLanguage || "English",
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
    const result = await summarizeContent({
      title: req.body?.title || "",
      text: req.body?.text || "",
      targetLanguage: req.body?.targetLanguage || "English",
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
    const result = await factCheckContent({
      title: req.body?.title || "",
      text: req.body?.text || "",
      tags: req.body?.tags || [],
    });

    return res.json(result);
  } catch (error) {
    return res.status(500).json({
      error: error.message || "Failed to review content.",
    });
  }
}
