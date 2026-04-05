/**
 * API layer with mock-data fallback.
 *
 * Every public function first tries the real backend.  If the request fails
 * (e.g. because DB / Redis keys are not yet configured), it transparently
 * returns realistic mock data so the frontend can be developed and demoed
 * without a live database.
 *
 * ⚡  Once the backend is connected to real services, remove
 *     USE_MOCK_FALLBACK or set it to false to disable the fallback path.
 */

import {
  mockPosts,
  mockNotifications,
  mockTrendingTopics,
  mockSuggestions,
  mockDiscoverBlogs,
  mockDiscoverCreators,
  discoverCategories,
  mockProfiles,
  mockComments,
  mockCommunities,
  getPostById as mockGetPostById,
  getRelatedPosts as mockGetRelatedPosts,
  getRandomPost as mockGetRandomPost,
  getProfileById as mockGetProfileById,
  getCommentsByPostId as mockGetCommentsByPostId,
  addComment as mockAddComment,
  deleteComment as mockDeleteComment,
} from "../data/mockData";

// ── Configuration ───────────────────────────────────────────────
// Set to `false` (or remove entirely) once the backend has live DB credentials.
const USE_MOCK_FALLBACK = true;

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

// ── Auth token plumbing (unchanged) ─────────────────────────────
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

// ── Core fetch helpers (unchanged) ──────────────────────────────
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

// ── Helper: wrap real call with mock fallback ───────────────────
function withFallback(realFn, mockFn) {
  return async (...args) => {
    if (!USE_MOCK_FALLBACK) return realFn(...args);

    try {
      return await realFn(...args);
    } catch {
      // Backend unreachable or returned an error → use mock data
      console.info("[api] Backend unavailable – serving mock data");
      return typeof mockFn === "function" ? mockFn(...args) : mockFn;
    }
  };
}

// ── Fake delay to mimic network latency for mock responses ──────
function delay(ms = 150) {
  return new Promise((r) => setTimeout(r, ms));
}

// ── Mock data adapters ──────────────────────────────────────────
// These transform the existing mockData shapes to match what each page
// component expects from the real API response.

function adaptPostForFeed(post) {
  return {
    ...post,
    summary: post.content,
    contentText: post.content,
    profileId: post.authorHandle?.replace("@", "") || null,
    isFollowingAuthor: false,
    isOwnAuthor: false,
  };
}

function adaptPostForDetail(post) {
  return {
    ...post,
    summary: post.content,
    contentText: post.content,
    content: `<p>${post.content}</p>`,
    profileId: post.authorHandle?.replace("@", "") || null,
    isFollowingAuthor: false,
    isOwnAuthor: false,
    mediaUrl: null,
    mediaType: null,
  };
}

function adaptProfileForPage(profile) {
  // Build a small set of fake follower/following lists from other profiles
  const otherProfiles = mockProfiles.filter((p) => p.id !== profile.id);

  const followersList = otherProfiles.map((p) => ({
    id: p.id,
    name: p.name,
    handle: p.handle,
    avatar: p.avatar,
    bio: p.bio,
    followers: p.followers,
    postsCount: p.posts,
    isFollowing: false,
    isOwnProfile: false,
  }));

  const followingList = otherProfiles.slice(0, 2).map((p) => ({
    id: p.id,
    name: p.name,
    handle: p.handle,
    avatar: p.avatar,
    bio: p.bio,
    followers: p.followers,
    postsCount: p.posts,
    isFollowing: true,
    isOwnProfile: false,
  }));

  // Build posts authored by this profile
  const authorPosts = mockPosts
    .filter(
      (post) =>
        post.authorHandle?.replace("@", "") === profile.id ||
        post.avatar === profile.avatar,
    )
    .map(adaptPostForFeed);

  return {
    ...profile,
    postsTotal: profile.posts,
    postsCount: profile.posts,
    isFollowing: false,
    isOwnProfile: false,
    followersList,
    followingList,
    posts: authorPosts,
  };
}

// ── Public API functions with fallbacks ──────────────────────────

export const getPosts = withFallback(
  () => fetchJson("/api/posts"),
  async () => {
    await delay();
    return mockPosts.map(adaptPostForFeed);
  },
);

export const getPostById = withFallback(
  (id) => fetchJson(`/api/posts/${id}`),
  async (id) => {
    await delay();
    const post = mockGetPostById(id);
    return post ? adaptPostForDetail(post) : null;
  },
);

export const getRelatedPosts = withFallback(
  (id) => fetchJson(`/api/posts/${id}/related`),
  async (id) => {
    await delay();
    return mockGetRelatedPosts(id).map(adaptPostForFeed);
  },
);

export const getRandomPost = withFallback(
  () => fetchJson("/api/posts/random"),
  async () => {
    await delay(80);
    return mockGetRandomPost();
  },
);

export const getPostComments = withFallback(
  (id) => fetchJson(`/api/posts/${id}/comments`),
  async (id) => {
    await delay();
    return mockGetCommentsByPostId(id);
  },
);

export const createComment = withFallback(
  (postId, payload) =>
    fetchJson(`/api/posts/${postId}/comments`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  async (postId, payload) => {
    await delay(200);
    return mockAddComment(postId, payload);
  },
);

async function _deleteComment(id) {
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

export const deleteComment = USE_MOCK_FALLBACK
  ? async (id) => {
      try {
        return await _deleteComment(id);
      } catch {
        console.info("[api] Backend unavailable – mock-deleting comment");
        await delay(100);
        mockDeleteComment(id);
      }
    }
  : _deleteComment;

export const createPost = withFallback(
  (payload) =>
    fetchJson("/api/posts", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  async (payload) => {
    await delay(300);
    const newPost = {
      id: Date.now(),
      avatar: "YU",
      authorName: "You",
      authorHandle: "@currentuser",
      time: "Just now",
      title: payload.title || "Untitled Post",
      content: payload.content || "",
      tags: payload.tags || [],
      likes: 0,
      dislikes: 0,
      comments: 0,
      bookmarks: 0,
      views: 0,
      readTime: "1 min read",
      createdAt: new Date().toISOString(),
    };
    mockPosts.unshift(newPost);
    return adaptPostForFeed(newPost);
  },
);

export async function uploadPostMedia(file) {
  try {
    const headers = await buildHeaders({ method: "POST", body: new FormData() });
    const formData = new FormData();
    formData.append("media", file);

    const response = await fetch(`${API_BASE_URL}/api/posts/media/upload`, {
      method: "POST",
      headers,
      body: formData,
    });

    return parseResponse(response);
  } catch {
    if (!USE_MOCK_FALLBACK) throw new Error("Media upload failed");
    console.info("[api] Backend unavailable – returning mock media URL");
    await delay(400);
    return {
      url: `https://placehold.co/800x400?text=${encodeURIComponent(file.name)}`,
      type: file.type?.startsWith("video") ? "video" : "image",
    };
  }
}

export const validatePostMediaUrl = withFallback(
  (payload) =>
    fetchJson("/api/posts/media/validate", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  async (payload) => {
    await delay(150);
    return { valid: true, url: payload.url, type: "image" };
  },
);

export const getNotifications = withFallback(
  () => fetchJson("/api/notifications"),
  async () => {
    await delay();
    return mockNotifications;
  },
);

export const getProfile = withFallback(
  (id) => fetchJson(`/api/profiles/${id}`),
  async (id) => {
    await delay();
    const profile = mockGetProfileById(id);
    return profile ? adaptProfileForPage(profile) : null;
  },
);

export const getCurrentProfile = withFallback(
  () => fetchJson("/api/profiles/current"),
  async () => {
    await delay();
    // Default to the first mock profile when not authenticated
    const profile = mockProfiles[0];
    return profile ? adaptProfileForPage(profile) : null;
  },
);

export const followProfile = withFallback(
  (id) =>
    fetchJson(`/api/profiles/${id}/follow`, { method: "POST" }),
  async (id) => {
    await delay(200);
    const profile = mockGetProfileById(id);
    if (profile) {
      profile.followers += 1;
    }
    return {
      isFollowing: true,
      profile: profile ? adaptProfileForPage(profile) : null,
    };
  },
);

export const unfollowProfile = withFallback(
  (id) =>
    fetchJson(`/api/profiles/${id}/follow`, { method: "DELETE" }),
  async (id) => {
    await delay(200);
    const profile = mockGetProfileById(id);
    if (profile) {
      profile.followers = Math.max(0, profile.followers - 1);
    }
    return {
      isFollowing: false,
      profile: profile ? adaptProfileForPage(profile) : null,
    };
  },
);

export const getSidebarData = withFallback(
  () => fetchJson("/api/meta/sidebar"),
  async () => {
    await delay();
    return {
      trendingTopics: mockTrendingTopics,
      suggestions: mockSuggestions.map((s) => ({
        ...s,
        id: s.handle.replace("@", ""),
        isFollowing: false,
        isOwnProfile: false,
      })),
    };
  },
);

export const getDiscoverData = withFallback(
  (params = {}) => {
    const query = new URLSearchParams();
    if (params.q) query.set("q", params.q);
    if (params.tag) query.set("tag", params.tag);
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return fetchJson(`/api/meta/discover${suffix}`);
  },
  async (params = {}) => {
    await delay();
    const q = (params.q || "").toLowerCase();
    const tag = (params.tag || "").toLowerCase();

    let blogs = [...mockDiscoverBlogs];
    let creators = [...mockDiscoverCreators];

    if (q) {
      blogs = blogs.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.summary.toLowerCase().includes(q) ||
          b.author.toLowerCase().includes(q) ||
          b.category.toLowerCase().includes(q),
      );
      creators = creators.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.note.toLowerCase().includes(q),
      );
    }

    if (tag) {
      blogs = blogs.filter(
        (b) => b.category.toLowerCase() === tag,
      );
    }

    return {
      blogs: blogs.map((b) => ({
        ...b,
        isFollowing: false,
        isOwnProfile: false,
      })),
      creators: creators.map((c) => ({
        ...c,
        isFollowing: false,
        isOwnProfile: false,
      })),
      categories: discoverCategories,
    };
  },
);
