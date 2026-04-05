const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

let authTokenGetter = null;

export function setAuthTokenGetter(getter) {
  authTokenGetter = typeof getter === "function" ? getter : null;
}

async function buildHeaders(options = {}) {
  const headers = new Headers(options.headers || {});
  const isFormDataBody = options.body instanceof FormData;

  if (options.body != null && !isFormDataBody && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (authTokenGetter && !headers.has("Authorization")) {
    try {
      const token = await authTokenGetter();
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
    } catch {
      // Ignore token lookup failures for public requests.
    }
  }

  return headers;
}

async function parseResponse(response) {
  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const body = isJson ? await response.json() : null;

  if (!response.ok) {
    throw new Error(body?.error || `Request failed with status ${response.status}`);
  }

  return body;
}

export async function fetchJson(path, options = {}) {
  const headers = await buildHeaders(options);
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  return parseResponse(response);
}

export function getPosts() {
  return fetchJson("/api/posts");
}

export function getPostById(id) {
  return fetchJson(`/api/posts/${id}`);
}

export function getRelatedPosts(id) {
  return fetchJson(`/api/posts/${id}/related`);
}

export function getRandomPost() {
  return fetchJson("/api/posts/random");
}

export function getPostComments(id) {
  return fetchJson(`/api/posts/${id}/comments`);
}

export function createComment(postId, payload) {
  return fetchJson(`/api/posts/${postId}/comments`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function deleteComment(id) {
  const headers = await buildHeaders({ method: "DELETE" });
  const response = await fetch(`${API_BASE_URL}/api/comments/${id}`, {
    method: "DELETE",
    headers,
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const body = await response.json();
      if (body?.error) message = body.error;
    } catch {
      // ignore empty body
    }
    throw new Error(message);
  }
}

export function createPost(payload) {
  return fetchJson("/api/posts", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function uploadPostMedia(file) {
  const headers = await buildHeaders({ method: "POST", body: new FormData() });
  const formData = new FormData();
  formData.append("media", file);

  const response = await fetch(`${API_BASE_URL}/api/posts/media/upload`, {
    method: "POST",
    headers,
    body: formData,
  });

  return parseResponse(response);
}

export function validatePostMediaUrl(payload) {
  return fetchJson("/api/posts/media/validate", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getNotifications() {
  return fetchJson("/api/notifications");
}

export function getProfile(id) {
  return fetchJson(`/api/profiles/${id}`);
}

export function getCurrentProfile() {
  return fetchJson("/api/profiles/current");
}

export function followProfile(id) {
  return fetchJson(`/api/profiles/${id}/follow`, {
    method: "POST",
  });
}

export function unfollowProfile(id) {
  return fetchJson(`/api/profiles/${id}/follow`, {
    method: "DELETE",
  });
}

export function getSidebarData() {
  return fetchJson("/api/meta/sidebar");
}

export function getDiscoverData(params = {}) {
  const query = new URLSearchParams();
  if (params.q) query.set("q", params.q);
  if (params.tag) query.set("tag", params.tag);
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return fetchJson(`/api/meta/discover${suffix}`);
}
