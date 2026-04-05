const IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "gif", "webp", "avif"]);
const VIDEO_EXTENSIONS = new Set(["mp4", "webm", "mov", "m4v", "ogg", "ogv"]);

function normalizeMediaType(value = "") {
  const normalized = String(value).trim().toLowerCase();
  return normalized === "image" || normalized === "video" ? normalized : "";
}

function parseHttpUrl(value) {
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

function getExtension(pathname = "") {
  const lastSegment = pathname.split("/").pop() || "";
  const ext = lastSegment.includes(".") ? lastSegment.split(".").pop() : "";
  return String(ext || "").toLowerCase();
}

export function detectMediaTypeFromUrl(value = "") {
  const parsed = parseHttpUrl(value);
  if (!parsed) return "";

  // Cloudinary URLs encode the asset class in the path, so we trust that first.
  if (parsed.hostname.includes("res.cloudinary.com")) {
    if (parsed.pathname.includes("/video/")) return "video";
    if (parsed.pathname.includes("/image/")) return "image";
  }

  const extension = getExtension(parsed.pathname);
  if (IMAGE_EXTENSIONS.has(extension)) return "image";
  if (VIDEO_EXTENSIONS.has(extension)) return "video";
  return "";
}

export function validateExternalMediaUrl(value = "", explicitType = "") {
  const parsed = parseHttpUrl(value);
  if (!parsed) {
    throw new Error("Please provide a valid http/https media URL.");
  }

  const mediaType = normalizeMediaType(explicitType) || detectMediaTypeFromUrl(parsed.toString());
  if (!mediaType) {
    throw new Error("Please provide a direct image or video URL.");
  }

  return {
    url: parsed.toString(),
    mediaType,
  };
}

export function getUploadMediaTypeFromMime(mimeType = "") {
  const normalized = String(mimeType).toLowerCase();
  if (normalized.startsWith("image/")) return "image";
  if (normalized.startsWith("video/")) return "video";
  return "";
}

export function assertUploadMimeType(mimeType = "") {
  const mediaType = getUploadMediaTypeFromMime(mimeType);
  if (!mediaType) {
    throw new Error("Only image and video uploads are supported.");
  }
  return mediaType;
}
