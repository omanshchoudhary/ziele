import { geminiClient } from "../integrations/geminiClient.js";
import { translateWithLibreTranslate } from "../integrations/libreTranslateClient.js";
import { stripHtml } from "./contentUtils.js";

const SUMMARY_MODEL = "gemini-1.5-flash";

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

async function runGeminiJsonPrompt(prompt) {
  if (!geminiClient) {
    throw new Error("Gemini is not configured.");
  }

  const model = geminiClient.getGenerativeModel({ model: SUMMARY_MODEL });
  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();
  const jsonStart = text.indexOf("{");
  const jsonEnd = text.lastIndexOf("}");

  if (jsonStart === -1 || jsonEnd === -1) {
    throw new Error("Gemini returned a non-JSON response.");
  }

  return JSON.parse(text.slice(jsonStart, jsonEnd + 1));
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
  } catch {
    return {
      translatedText: normalizedText,
      detectedLanguage: sourceLanguage,
      targetLanguage,
      fallbackUsed: true,
      message:
        "Translation is unavailable right now, so the original text is shown as a fallback.",
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
  } catch {
    return {
      summary: fallbackSummary,
      keyPoints: splitSentences(fallbackSummary).slice(0, 3),
      fallbackUsed: true,
      message:
        "Gemini is unavailable right now, so a simple extractive summary is shown instead.",
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
  } catch {
    return {
      ...heuristicSummary,
      flags: heuristicFlags,
      factCheck:
        "Gemini is unavailable right now, so this result is based only on local spam and certainty rules.",
      fallbackUsed: true,
      message:
        "AI review is unavailable right now. Showing rule-based moderation hints instead.",
    };
  }
}
