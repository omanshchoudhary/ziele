const IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "gif", "webp", "avif"]);
const VIDEO_EXTENSIONS = new Set(["mp4", "webm", "mov", "m4v", "ogg", "ogv"]);

function normalizeMediaType(value = "") {
  const normalized = String(value).trim().toLowerCase();
  return normalized === "image" || normalized === "video" ? normalized : "";
}

function parseHttpUrl(value = "") {
  try {
    const parsed = new URL(String(value).trim());
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function getSafeMediaDescriptor(mediaUrl = "", explicitType = "") {
  const parsed = parseHttpUrl(mediaUrl);
  if (!parsed) return null;

  let mediaType = normalizeMediaType(explicitType);

  if (!mediaType && parsed.hostname.includes("res.cloudinary.com")) {
    if (parsed.pathname.includes("/video/")) mediaType = "video";
    if (parsed.pathname.includes("/image/")) mediaType = "image";
  }

  if (!mediaType) {
    const filename = parsed.pathname.split("/").pop() || "";
    const extension = filename.includes(".")
      ? filename.split(".").pop().toLowerCase()
      : "";

    if (IMAGE_EXTENSIONS.has(extension)) mediaType = "image";
    if (VIDEO_EXTENSIONS.has(extension)) mediaType = "video";
  }

  if (!mediaType) return null;

  return {
    url: parsed.toString(),
    type: mediaType,
  };
}
