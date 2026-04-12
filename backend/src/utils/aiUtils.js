import { geminiClient } from "../integrations/geminiClient.js";
import { translateWithLibreTranslate } from "../integrations/libreTranslateClient.js";
import { env } from "../config/env.js";
import { stripHtml } from "./contentUtils.js";

const DEFAULT_GEMINI_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
  "gemini-1.5-flash",
];

const LANGUAGE_CODE_MAP = {
  arabic: "ar",
  chinese: "zh",
  dutch: "nl",
  english: "en",
  french: "fr",
  german: "de",
  hindi: "hi",
  italian: "it",
  japanese: "ja",
  korean: "ko",
  portuguese: "pt",
  russian: "ru",
  spanish: "es",
  tamil: "ta",
};

const SPAM_PHRASES = [
  "click here",
  "buy now",
  "free money",
  "guaranteed",
  "limited time",
  "urgent",
  "subscribe now",
  "100% true",
  "act now",
];

function normalizeText(value = "") {
  return stripHtml(String(value || "")).replace(/\s+/g, " ").trim();
}

function splitSentences(text) {
  return normalizeText(text)
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function normalizeLanguageCode(language = "English") {
  const key = String(language || "").trim().toLowerCase();
  return LANGUAGE_CODE_MAP[key] || key || "en";
}

function dedupeTruthyStrings(values = []) {
  const seen = new Set();
  const result = [];

  for (const value of values) {
    const normalized = String(value || "").trim();
    if (!normalized) continue;

    const key = normalized.toLowerCase();
    if (seen.has(key)) continue;

    seen.add(key);
    result.push(normalized);
  }

  return result;
}

function resolveGeminiModelCandidates() {
  return dedupeTruthyStrings([
    env.gemini.model,
    ...(env.gemini.fallbackModels || []),
    ...DEFAULT_GEMINI_MODELS,
  ]);
}

function buildFallbackSummary(text, sentenceCount = 2) {
  const sentences = splitSentences(text);
  if (sentences.length === 0) {
    return "No content available to summarize.";
  }

  return sentences.slice(0, sentenceCount).join(" ");
}

function collectHeuristicFlags({ title = "", content = "" }) {
  const text = `${normalizeText(title)} ${normalizeText(content)}`.trim();
  const lower = text.toLowerCase();
  const flags = [];

  const linkMatches = text.match(/https?:\/\/|www\./gi) || [];
  if (linkMatches.length >= 3) {
    flags.push({
      code: "excessive_links",
      label: "Link-heavy",
      severity: "medium",
      confidence: 0.73,
      description: "The post contains several outbound links, which can indicate promotional spam.",
    });
  }

  const matchedPhrase = SPAM_PHRASES.find((phrase) => lower.includes(phrase));
  if (matchedPhrase) {
    flags.push({
      code: "spam_phrase",
      label: "Spam language",
      severity: "high",
      confidence: 0.82,
      description: `The copy includes the phrase "${matchedPhrase}", which often appears in spammy posts.`,
    });
  }

  if (/(.)\1{4,}/.test(text) || /[!?]{4,}/.test(text)) {
    flags.push({
      code: "repetition",
      label: "Aggressive punctuation",
      severity: "medium",
      confidence: 0.68,
      description: "Repeated characters or punctuation can be a sign of attention-grabbing spam.",
    });
  }

  const letters = text.replace(/[^a-z]/gi, "");
  const upperLetters = text.replace(/[^A-Z]/g, "");
  if (letters.length >= 24 && upperLetters.length / letters.length > 0.45) {
    flags.push({
      code: "all_caps",
      label: "Shouting",
      severity: "medium",
      confidence: 0.66,
      description: "A large portion of the text is uppercase, which can reduce trust and readability.",
    });
  }

  if (/\b(always|never|guaranteed|undeniable|proven)\b/i.test(text)) {
    flags.push({
      code: "certainty_claim",
      label: "Strong certainty claim",
      severity: "low",
      confidence: 0.58,
      description: "The post uses absolute language that may deserve manual fact-checking.",
    });
  }

  return flags;
}

function summarizeHeuristics(flags = []) {
  const highestSeverity =
    flags.find((flag) => flag.severity === "high")?.severity ||
    flags.find((flag) => flag.severity === "medium")?.severity ||
    "low";

  const highestConfidence = flags.reduce(
    (best, flag) => Math.max(best, Number(flag.confidence || 0)),
    0.22,
  );

  if (flags.length === 0) {
    return {
      label: "Looks clear",
      status: "clear",
      confidence: 0.22,
      summary:
        "No strong spam indicators were detected by the local rule set. Claims may still need human verification.",
    };
  }

  if (highestSeverity === "high") {
    return {
      label: "High review priority",
      status: "warning",
      confidence: highestConfidence,
      summary:
        "Several high-signal spam indicators were detected. Review before publishing or promoting this post.",
    };
  }

  return {
    label: "Needs review",
    status: "review",
    confidence: highestConfidence,
    summary:
      "The post has a few signals that may be promotional or overly certain. A quick manual review is recommended.",
  };
}

function extractJsonText(rawText = "") {
  const text = String(rawText || "").trim();
  if (!text) {
    throw new Error("Gemini returned an empty response.");
  }

  // Direct JSON payload.
  if (text.startsWith("{") && text.endsWith("}")) {
    return text;
  }

  // Markdown fenced JSON block.
  const fencedMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fencedMatch?.[1]) {
    return fencedMatch[1].trim();
  }

  // Best-effort object extraction.
  const jsonStart = text.indexOf("{");
  const jsonEnd = text.lastIndexOf("}");
  if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
    return text.slice(jsonStart, jsonEnd + 1);
  }

  throw new Error("Gemini returned a non-JSON response.");
}

function shouldTryNextGeminiModel(error) {
  const message = String(error?.message || "").toLowerCase();
  return (
    message.includes("not found") ||
    message.includes("is not supported for generatecontent") ||
    message.includes("quota exceeded") ||
    message.includes("too many requests") ||
    message.includes("resource exhausted")
  );
}

function buildGeminiFallbackMessage(error) {
  const message = String(error?.message || "");
  if (/not configured/i.test(message)) {
    return "Gemini is not configured yet, so a local fallback result is shown.";
  }
  if (/api key.+not valid|api[_\s-]?key/i.test(message)) {
    return "Gemini API key is invalid or expired, so a local fallback result is shown.";
  }
  if (/not found|not supported for generatecontent/i.test(message)) {
    return "The configured Gemini model is unavailable, so a local fallback result is shown.";
  }

  return "Gemini is unavailable right now, so a local fallback result is shown.";
}

function buildLibreTranslateFallbackMessage(error) {
  const message = String(error?.message || "");
  if (/api key/i.test(message) && /libretranslate/i.test(message)) {
    return "LibreTranslate requires an API key on this host. Add LIBRETRANSLATE_API_KEY to enable live translation.";
  }

  return "Translation is unavailable right now, so the original text is shown as a fallback.";
}

async function runGeminiJsonPrompt(prompt) {
  if (!geminiClient) {
    throw new Error("Gemini is not configured.");
  }

  const modelCandidates = resolveGeminiModelCandidates();
  let lastError = null;

  for (const modelName of modelCandidates) {
    try {
      const model = geminiClient.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      return JSON.parse(extractJsonText(text));
    } catch (error) {
      lastError = error;
      if (shouldTryNextGeminiModel(error)) {
        continue;
      }

      throw error;
    }
  }

  throw lastError || new Error("No compatible Gemini model is available.");
}

export async function translateContent({
  text,
  sourceLanguage = "auto",
  targetLanguage = "English",
}) {
  const normalizedText = normalizeText(text);

  if (!normalizedText) {
    return {
      translatedText: "",
      detectedLanguage: sourceLanguage,
      targetLanguage,
      fallbackUsed: true,
      message: "There is no content to translate yet.",
    };
  }

  try {
    const result = await translateWithLibreTranslate({
      q: normalizedText,
      source: sourceLanguage === "auto" ? "auto" : normalizeLanguageCode(sourceLanguage),
      target: normalizeLanguageCode(targetLanguage),
    });

    return {
      translatedText: result.translatedText || normalizedText,
      detectedLanguage: result.detectedLanguage?.language || sourceLanguage,
      targetLanguage,
      fallbackUsed: false,
      message: `Translated with LibreTranslate to ${targetLanguage}.`,
    };
  } catch (error) {
    try {
      const response = await runGeminiJsonPrompt(`
Return valid JSON only.
Translate the following text into ${targetLanguage}.
Keep the meaning and tone, and avoid adding extra commentary.
If the text is already in the requested language, return it as-is.

JSON shape:
{
  "translatedText": "string",
  "detectedLanguage": "string"
}

Source language hint: ${sourceLanguage}
Content:
${normalizedText}
`);

      return {
        translatedText: response.translatedText || normalizedText,
        detectedLanguage: response.detectedLanguage || sourceLanguage,
        targetLanguage,
        fallbackUsed: false,
        message: `Translated with Gemini to ${targetLanguage} because LibreTranslate is unavailable.`,
      };
    } catch {
      // If both translators fail, we keep a deterministic local fallback below.
    }

    return {
      translatedText: normalizedText,
      detectedLanguage: sourceLanguage,
      targetLanguage,
      fallbackUsed: true,
      message: buildLibreTranslateFallbackMessage(error),
    };
  }
}

export async function summarizeContent({
  title = "",
  text,
  targetLanguage = "English",
}) {
  const normalizedText = normalizeText(text);
  const fallbackSummary = buildFallbackSummary(normalizedText, 3);

  if (!normalizedText) {
    return {
      summary: fallbackSummary,
      fallbackUsed: true,
      message: "There is no content to summarize yet.",
      targetLanguage,
    };
  }

  try {
    const response = await runGeminiJsonPrompt(`
Return valid JSON only.
Summarize the following blog post in ${targetLanguage}.
Keep it concise, clear, and useful for a reader preview.

JSON shape:
{
  "summary": "string",
  "keyPoints": ["string"]
}

Title: ${title || "Untitled"}
Content:
${normalizedText}
`);

    return {
      summary: response.summary || fallbackSummary,
      keyPoints: Array.isArray(response.keyPoints) ? response.keyPoints.slice(0, 4) : [],
      fallbackUsed: false,
      message: `Summary generated in ${targetLanguage}.`,
      targetLanguage,
    };
  } catch (error) {
    return {
      summary: fallbackSummary,
      keyPoints: splitSentences(fallbackSummary).slice(0, 3),
      fallbackUsed: true,
      message: buildGeminiFallbackMessage(error),
      targetLanguage,
    };
  }
}

export async function factCheckContent({
  title = "",
  text,
  tags = [],
}) {
  const normalizedText = normalizeText(text);
  const heuristicFlags = collectHeuristicFlags({ title, content: normalizedText });
  const heuristicSummary = summarizeHeuristics(heuristicFlags);

  if (!normalizedText) {
    return {
      ...heuristicSummary,
      flags: heuristicFlags,
      factCheck: "There is no content to inspect yet.",
      fallbackUsed: true,
      message: "Add more content to get moderation hints.",
    };
  }

  try {
    const response = await runGeminiJsonPrompt(`
Return valid JSON only.
You are helping moderate a social blogging platform.
Review the post for two things:
1. likely spam or manipulative writing
2. factual overclaiming or unsupported certainty

Do not pretend to know external facts with certainty.
If something looks suspicious but cannot be verified from the text alone, say it is "unverified".

JSON shape:
{
  "label": "Looks clear | Needs review | High review priority",
  "status": "clear | review | warning",
  "confidence": 0.0,
  "factCheck": "string",
  "summary": "string",
  "flags": [
    {
      "code": "string",
      "label": "string",
      "severity": "low | medium | high",
      "confidence": 0.0,
      "description": "string"
    }
  ]
}

Title: ${title || "Untitled"}
Tags: ${Array.isArray(tags) ? tags.join(", ") : ""}
Content:
${normalizedText}
`);

    const aiFlags = Array.isArray(response.flags) ? response.flags : [];
    const combinedFlags = [...heuristicFlags, ...aiFlags].slice(0, 6);

    return {
      label: response.label || heuristicSummary.label,
      status: response.status || heuristicSummary.status,
      confidence: Number(response.confidence || heuristicSummary.confidence),
      summary: response.summary || heuristicSummary.summary,
      factCheck:
        response.factCheck ||
        "The content could not be fully verified automatically. Review strong claims manually before trusting them.",
      flags: combinedFlags,
      fallbackUsed: false,
      message:
        combinedFlags.length > 0
          ? "Moderation hints combine local rules and Gemini review."
          : "Gemini did not find notable moderation issues.",
    };
  } catch (error) {
    return {
      ...heuristicSummary,
      flags: heuristicFlags,
      factCheck:
        `${buildGeminiFallbackMessage(error)} This result is based only on local spam and certainty rules.`,
      fallbackUsed: true,
      message:
        "AI review is unavailable right now. Showing rule-based moderation hints instead.",
    };
  }
}
