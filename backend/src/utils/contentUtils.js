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

export function stripHtml(value = "") {
  return String(value)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function sanitizeRichText(value = "") {
  const raw = String(value || "");

  return raw
    .replace(/<\s*(script|style|iframe|object|embed|meta|link)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, "")
    .replace(/<\s*(script|style|iframe|object|embed|meta|link)[^>]*\/?\s*>/gi, "")
    .replace(/\son[a-z]+\s*=\s*"[^"]*"/gi, "")
    .replace(/\son[a-z]+\s*=\s*'[^']*'/gi, "")
    .replace(/\son[a-z]+\s*=\s*[^\s>]+/gi, "")
    .replace(/\s(href|src)\s*=\s*"(javascript:[^"]*)"/gi, ' $1="#"')
    .replace(/\s(href|src)\s*=\s*'(javascript:[^']*)'/gi, " $1='#'")
    .trim();
}

export function sanitizePlainText(value = "") {
  return stripHtml(value).slice(0, 2000);
}

export function estimateReadTime(content = "") {
  const words = stripHtml(content).split(/\s+/).filter(Boolean).length;
  if (!words) return "0 min read";
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min read`;
}

export function formatCompactNumber(value) {
  if (typeof value !== "number" || Number.isNaN(value)) return "0";
  if (value >= 1000000) return `${(value / 1000000).toFixed(1).replace(".0", "")}m`;
  if (value >= 1000) return `${(value / 1000).toFixed(1).replace(".0", "")}k`;
  return String(value);
}

export function formatRelativeTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Just now";

  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function normalizeHandle(value = "") {
  return String(value).toLowerCase().replace(/^@/, "");
}

export function normalizeTag(value = "") {
  return String(value).trim().replace(/^#/, "");
}

export function slugifyTitle(value = "") {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);
}

export function parsePostId(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : NaN;
  const matched = String(value || "").match(/\d+/);
  return matched ? Number(matched[0]) : NaN;
}

export function collectSpamSignals({ title = "", text = "" } = {}) {
  const normalized = `${stripHtml(title)} ${stripHtml(text)}`.toLowerCase();
  const links = normalized.match(/https?:\/\/|www\./g) || [];
  const flags = [];

  if (links.length >= 4) {
    flags.push("too_many_links");
  }

  if (/[!?]{4,}/.test(normalized)) {
    flags.push("aggressive_punctuation");
  }

  if (/(.)\1{5,}/.test(normalized)) {
    flags.push("repeated_characters");
  }

  if (SPAM_PHRASES.some((phrase) => normalized.includes(phrase))) {
    flags.push("spam_phrase");
  }

  return flags;
}

export function enforceContentSafety({ title = "", text = "" } = {}) {
  const flags = collectSpamSignals({ title, text });

  if (flags.includes("spam_phrase") || flags.includes("too_many_links")) {
    const error = new Error(
      "Content appears spammy (links or promotional phrases). Please revise and try again.",
    );
    error.code = "CONTENT_BLOCKED";
    throw error;
  }

  return flags;
}
