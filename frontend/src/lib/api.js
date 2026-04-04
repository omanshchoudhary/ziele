const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

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
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
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
  const response = await fetch(`${API_BASE_URL}/api/comments/${id}`, {
    method: "DELETE",
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

export function getNotifications() {
  return fetchJson("/api/notifications");
}

export function getProfile(id) {
  return fetchJson(`/api/profiles/${id}`);
}

export function getCurrentProfile() {
  return fetchJson("/api/profiles/current");
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
