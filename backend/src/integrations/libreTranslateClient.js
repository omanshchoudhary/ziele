import { env } from "../config/env.js";

export async function translateWithLibreTranslate({
  q,
  source = "auto",
  target,
  format = "text",
}) {
  const response = await fetch(`${env.libreTranslate.apiUrl}/translate`, {
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
    throw new Error(`LibreTranslate request failed with status ${response.status}`);
  }

  return response.json();
}
