import { env } from "../config/env.js";

function buildTranslateUrl() {
  const baseUrl = String(env.libreTranslate.apiUrl || "https://libretranslate.com")
    .trim()
    .replace(/\/+$/, "");
  return `${baseUrl}/translate`;
}

export async function translateWithLibreTranslate({
  q,
  source = "auto",
  target,
  format = "text",
}) {
  const response = await fetch(buildTranslateUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      q,
      source,
      target,
      format,
      api_key: env.libreTranslate.apiKey || undefined,
    }),
  });

  if (!response.ok) {
    let details = "";

    try {
      const payload = await response.json();
      details =
        payload?.error ||
        payload?.message ||
        (typeof payload === "string" ? payload : JSON.stringify(payload));
    } catch {
      details = await response.text().catch(() => "");
    }

    const suffix = details ? `: ${String(details).slice(0, 300)}` : "";
    throw new Error(
      `LibreTranslate request failed with status ${response.status}${suffix}`,
    );
  }

  const payload = await response.json();
  if (payload?.error) {
    throw new Error(`LibreTranslate error: ${payload.error}`);
  }

  return payload;
}
