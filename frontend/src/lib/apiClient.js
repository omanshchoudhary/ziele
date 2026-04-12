import { io } from "socket.io-client";
import {
  mockNotifications,
  mockTrendingTopics,
  mockSuggestions,
  mockDiscoverBlogs,
  mockDiscoverCreators,
  discoverCategories,
  mockProfiles,
  mockPosts,
  getPostById as mockGetPostById,
  getRelatedPosts as mockGetRelatedPosts,
  getRandomPost as mockGetRandomPost,
  getProfileById as mockGetProfileById,
  getCommentsByPostId as mockGetCommentsByPostId,
  addComment as mockAddComment,
  deleteComment as mockDeleteComment,
} from "../data/mockData";

const USE_MOCK_FALLBACK =
  String(import.meta.env.VITE_USE_MOCK_FALLBACK || "true").toLowerCase() ===
  "true";
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
      // Public requests should keep working even if token lookup fails.
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

function withFallback(realFn, mockFn) {
  return async (...args) => {
    if (!USE_MOCK_FALLBACK) return realFn(...args);

    try {
      return await realFn(...args);
    } catch {
      return typeof mockFn === "function" ? mockFn(...args) : mockFn;
    }
  };
}

function delay(ms = 150) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function stripHtml(value = "") {
  return String(value)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizePostText(post) {
  return stripHtml(post.summary || post.contentText || post.content || "");
}

function adaptPostForFeed(post) {
  return {
    ...post,
    summary: normalizePostText(post),
    contentText: stripHtml(post.contentText || post.content || ""),
    profileId: post.profileId || post.authorHandle?.replace("@", "") || null,
    isFollowingAuthor: Boolean(post.isFollowingAuthor),
    isOwnAuthor: Boolean(post.isOwnAuthor),
    viewerReaction: post.viewerReaction || null,
    isBookmarked: Boolean(post.isBookmarked),
    sharePath: post.sharePath || `/post/${post.id}`,
  };
}

function adaptPostForDetail(post) {
  return {
    ...adaptPostForFeed(post),
    content: post.content?.startsWith?.("<")
      ? post.content
      : `<p>${normalizePostText(post)}</p>`,
    mediaUrl: post.mediaUrl || null,
    mediaType: post.mediaType || null,
  };
}

function adaptProfileForPage(profile) {
  const otherProfiles = mockProfiles.filter((item) => item.id !== profile.id);
  const followersList = otherProfiles.map((item) => ({
    id: item.id,
    name: item.name,
    handle: item.handle,
    avatar: item.avatar,
    bio: item.bio,
    followers: item.followers,
    postsCount: item.posts,
    isFollowing: false,
    isOwnProfile: false,
  }));
  const followingList = otherProfiles.slice(0, 2).map((item) => ({
    id: item.id,
    name: item.name,
    handle: item.handle,
    avatar: item.avatar,
    bio: item.bio,
    followers: item.followers,
    postsCount: item.posts,
    isFollowing: true,
    isOwnProfile: false,
  }));

  return {
    ...profile,
    postsTotal: profile.posts,
    postsCount: profile.posts,
    isFollowing: false,
    isOwnProfile: false,
    followersList,
    followingList,
    posts: mockPosts
      .filter((post) => post.authorHandle?.replace("@", "") === profile.id)
      .map(adaptPostForFeed),
  };
}

function localModerationResult({ title = "", text = "" }) {
  const content = `${title} ${text}`.toLowerCase();
  const flags = [];

  if (/click here|buy now|guaranteed|free money/.test(content)) {
    flags.push({
      code: "spam_phrase",
      label: "Spam language",
      severity: "high",
      confidence: 0.78,
      description: "The draft uses phrases commonly associated with spam.",
    });
  }

  if (/[!?]{4,}/.test(content)) {
    flags.push({
      code: "punctuation",
      label: "Aggressive punctuation",
      severity: "medium",
      confidence: 0.61,
      description: "Repeated punctuation can look promotional or manipulative.",
    });
  }

  return {
    label: flags.length ? "Needs review" : "Looks clear",
    status: flags.length ? "review" : "clear",
    confidence: flags.length ? 0.61 : 0.22,
    summary: flags.length
      ? "The local fallback found a few spam-like signals."
      : "No strong local spam signals were detected.",
    factCheck:
      "This is a local fallback only. Strong claims should still be checked manually.",
    flags,
    fallbackUsed: true,
    message: "AI review is unavailable, so local moderation hints are shown instead.",
  };
}

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

async function deleteCommentRequest(id) {
  const headers = await buildHeaders({ method: "DELETE" });
  const response = await fetch(`${API_BASE_URL}/api/comments/${id}`, {
    method: "DELETE",
    headers,
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const body = await response.json();
      if (body?.error) {
        message = body.error;
      }
    } catch {
      // Ignore empty delete responses.
    }
    throw new Error(message);
  }
}

export const deleteComment = USE_MOCK_FALLBACK
  ? async (id) => {
      try {
        return await deleteCommentRequest(id);
      } catch {
        await delay(100);
        mockDeleteComment(id);
      }
    }
  : deleteCommentRequest;

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
      viewerReaction: null,
      isBookmarked: false,
    };

    mockPosts.unshift(newPost);
    return adaptPostForFeed(newPost);
  },
);

export const reactToPost = withFallback(
  (postId, type) =>
    fetchJson(`/api/posts/${postId}/reaction`, {
      method: "POST",
      body: JSON.stringify({ type }),
    }),
  async (postId, type) => {
    await delay(120);
    const post = mockPosts.find((item) => Number(item.id) === Number(postId));
    if (!post) {
      throw new Error("Post not found");
    }

    const nextReaction = post.viewerReaction === type ? null : type;
    if (post.viewerReaction === "like") {
      post.likes = Math.max(0, (post.likes || 0) - 1);
    }
    if (post.viewerReaction === "dislike") {
      post.dislikes = Math.max(0, (post.dislikes || 0) - 1);
    }

    if (nextReaction === "like") {
      post.likes = (post.likes || 0) + 1;
    }
    if (nextReaction === "dislike") {
      post.dislikes = (post.dislikes || 0) + 1;
    }

    post.viewerReaction = nextReaction;

    return {
      reaction: nextReaction,
      post: adaptPostForFeed(post),
    };
  },
);

export const toggleBookmark = withFallback(
  (postId) =>
    fetchJson(`/api/posts/${postId}/bookmark`, {
      method: "POST",
    }),
  async (postId) => {
    await delay(120);
    const post = mockPosts.find((item) => Number(item.id) === Number(postId));
    if (!post) {
      throw new Error("Post not found");
    }

    post.isBookmarked = !post.isBookmarked;
    post.bookmarks = post.isBookmarked
      ? (post.bookmarks || 0) + 1
      : Math.max(0, (post.bookmarks || 0) - 1);

    return {
      bookmarked: post.isBookmarked,
      post: adaptPostForFeed(post),
    };
  },
);

export const getBookmarkedPosts = withFallback(
  () => fetchJson("/api/posts/bookmarks/list"),
  async () => {
    await delay(120);
    return mockPosts
      .filter((post) => post.isBookmarked)
      .map((post) => ({
        ...adaptPostForFeed(post),
        savedAt: new Date().toISOString(),
      }));
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
    await delay(400);
    return {
      url: `https://placehold.co/800x400?text=${encodeURIComponent(file.name)}`,
      mediaType: file.type?.startsWith("video") ? "video" : "image",
      mediaSource: "upload",
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
    return {
      url: payload.mediaUrl || payload.url,
      mediaType: "image",
      mediaSource: "url",
    };
  },
);

export const translatePostContent = withFallback(
  (payload) =>
    fetchJson("/api/ai/translate", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  async (payload) => {
    await delay(220);
    return {
      translatedText: payload.text || "",
      targetLanguage: payload.targetLanguage || "English",
      fallbackUsed: true,
      message: "Translation service is unavailable, so the original text is shown.",
    };
  },
);

export const summarizePostContent = withFallback(
  (payload) =>
    fetchJson("/api/ai/summarize", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  async (payload) => {
    await delay(220);
    const text = String(payload.text || "")
      .replace(/<[^>]*>/g, " ")
      .trim();
    return {
      summary: text.split(/\.\s+/).slice(0, 2).join(". "),
      keyPoints: [],
      targetLanguage: payload.targetLanguage || "English",
      fallbackUsed: true,
      message: "Gemini is unavailable, so a short local summary is shown.",
    };
  },
);

export const factCheckPostContent = withFallback(
  (payload) =>
    fetchJson("/api/ai/fact-check", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  async (payload) => {
    await delay(220);
    return localModerationResult(payload);
  },
);

export const getNotifications = withFallback(
  () => fetchJson("/api/notifications"),
  async () => {
    await delay();
    return mockNotifications;
  },
);

export const getUnreadNotificationCount = withFallback(
  () => fetchJson("/api/notifications/unread-count"),
  async () => {
    await delay(60);
    return {
      unreadCount: mockNotifications.filter((item) => !item.read).length,
    };
  },
);

export const markNotificationsRead = withFallback(
  () =>
    fetchJson("/api/notifications/mark-read", {
      method: "POST",
    }),
  async () => {
    await delay(80);
    return { ok: true };
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
    const profile = mockProfiles[0];
    return profile ? adaptProfileForPage(profile) : null;
  },
);

export const followProfile = withFallback(
  (id) => fetchJson(`/api/profiles/${id}/follow`, { method: "POST" }),
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
  (id) => fetchJson(`/api/profiles/${id}/follow`, { method: "DELETE" }),
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
      suggestions: mockSuggestions.map((item) => ({
        ...item,
        id: item.handle.replace("@", ""),
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
    const tagQueries = String(params.tag || "")
      .split(",")
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean);

    const postBlogs = mockPosts.map((post) => ({
      id: post.id,
      profileId: post.authorHandle?.replace("@", "") || null,
      title: post.title,
      summary: stripHtml(post.content),
      author: post.authorName,
      authorHandle: post.authorHandle,
      time: post.time || "Just now",
      category: post.tags?.[0] || "General",
      tags: post.tags || [],
      views:
        typeof post.views === "number"
          ? post.views >= 1000
            ? `${(post.views / 1000).toFixed(1).replace(".0", "")}k`
            : String(post.views)
          : "0",
      readTime: post.readTime || "1 min read",
    }));

    let blogs = [...mockDiscoverBlogs, ...postBlogs];
    let creators = [...mockDiscoverCreators];

    const seenTitles = new Set();
    blogs = blogs.filter((item) => {
      const key = item.title.toLowerCase();
      if (seenTitles.has(key)) return false;
      seenTitles.add(key);
      return true;
    });

    if (q) {
      blogs = blogs.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.summary.toLowerCase().includes(q) ||
          item.author.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q),
      );
      creators = creators.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.note.toLowerCase().includes(q),
      );
    }

    if (tagQueries.length > 0) {
      blogs = blogs.filter((item) =>
        (item.tags || []).some((tag) =>
          tagQueries.includes(String(tag || "").trim().toLowerCase()),
        ) || tagQueries.includes(item.category.toLowerCase()),
      );
    }

    const categories = [
      "Recommended",
      ...new Set(
        [
          ...discoverCategories,
          ...blogs.map((item) => item.category),
          ...blogs.flatMap((item) => item.tags || []),
        ]
          .filter(Boolean)
          .filter((item) => item !== "Recommended"),
      ),
    ];

    return {
      blogs: blogs.map((item) => ({
        ...item,
        isFollowingAuthor: false,
        isOwnAuthor: false,
      })),
      creators: creators.map((item) => ({
        ...item,
        isFollowing: false,
        isOwnProfile: false,
      })),
      categories,
    };
  },
);

export const getRecommendationsData = withFallback(
  (params = {}) => {
    const query = new URLSearchParams();
    if (params.limit) query.set("limit", String(params.limit));
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return fetchJson(`/api/meta/recommendations${suffix}`);
  },
  async () => {
    await delay(120);
    return mockPosts.slice(0, 8).map(adaptPostForFeed);
  },
);

export const getTrendingData = withFallback(
  (params = {}) => {
    const query = new URLSearchParams();
    if (params.q) query.set("q", params.q);
    if (params.tag) query.set("tag", params.tag);
    if (params.limit) query.set("limit", String(params.limit));
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return fetchJson(`/api/meta/trending${suffix}`);
  },
  async () => {
    await delay(140);
    return {
      topics: mockTrendingTopics.map((topic) => ({
        topic: topic.topic,
        tag: topic.tag,
        score: Number(topic.posts) || 0,
      })),
      posts: mockPosts.map((post, index) => ({
        ...adaptPostForFeed(post),
        trendScore: (post.likes || 0) * 4 + (post.comments || 0) * 3 + (post.views || 0) * 0.1,
        trendRank: index + 1,
      })),
      authors: mockProfiles.slice(0, 6).map((profile, index) => ({
        id: profile.id,
        name: profile.name,
        handle: profile.handle,
        avatar: profile.avatar,
        score: 100 - index * 8,
        posts: profile.posts || 0,
      })),
    };
  },
);

export const getCommunitiesData = withFallback(
  (params = {}) => {
    const query = new URLSearchParams();
    if (params.q) query.set("q", params.q);
    if (params.tag) query.set("tag", params.tag);
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return fetchJson(`/api/meta/communities${suffix}`);
  },
  async () => {
    await delay(140);
    const communities = discoverCategories
      .filter((category) => category !== "Recommended")
      .map((category, index) => ({
        id: category.toLowerCase(),
        name: `${category} Community`,
        category,
        description: `Talk about ${category} with active creators.`,
        posts: 12 + index * 3,
        members: 240 + index * 45,
        trendScore: 80 - index * 4,
        tags: [category],
      }));

    return {
      communities,
      categories: discoverCategories,
    };
  },
);

export const getAnalyticsData = withFallback(
  (params = {}) => {
    const query = new URLSearchParams();
    if (params.range) query.set("range", String(params.range));
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return fetchJson(`/api/meta/analytics${suffix}`);
  },
  async (params = {}) => {
    await delay(160);
    const range = Number(params.range || 30);
    const series = Array.from({ length: range }, (_, index) => ({
      date: `Day ${index + 1}`,
      views: 20 + index * 2,
      likes: 8 + Math.floor(index * 1.4),
      dislikes: Math.floor(index / 10),
      comments: 2 + Math.floor(index * 0.6),
    }));

    return {
      range,
      generatedAt: new Date().toISOString(),
      totals: {
        posts: mockPosts.length,
        views: mockPosts.reduce((sum, post) => sum + (post.views || 0), 0),
        likes: mockPosts.reduce((sum, post) => sum + (post.likes || 0), 0),
        dislikes: mockPosts.reduce((sum, post) => sum + (post.dislikes || 0), 0),
        bookmarks: mockPosts.reduce((sum, post) => sum + (post.bookmarks || 0), 0),
        comments: mockPosts.reduce((sum, post) => sum + (post.comments || 0), 0),
        followers: 1200,
        streak: 14,
      },
      streakMilestones: [
        { target: 7, reached: true, remaining: 0 },
        { target: 30, reached: false, remaining: 16 },
        { target: 100, reached: false, remaining: 86 },
      ],
      series,
      topPosts: mockPosts.slice(0, 5).map((post, index) => ({
        id: post.id,
        title: post.title,
        views: post.views || 0,
        likes: post.likes || 0,
        dislikes: post.dislikes || 0,
        comments: post.comments || 0,
        score: 100 - index * 7,
      })),
    };
  },
);

export function connectNotificationsSocket({
  profileId,
  onNotification,
  onConnect,
  onDisconnect,
  onError,
}) {
  if (!profileId) {
    return () => {};
  }

  const socket = io(API_BASE_URL, {
    transports: ["websocket", "polling"],
  });

  socket.on("connect", () => {
    socket.emit("notifications:subscribe", { profileId });
    onConnect?.();
  });

  socket.on("notifications:new", (payload) => {
    onNotification?.(payload);
  });

  socket.on("disconnect", () => {
    onDisconnect?.();
  });

  socket.on("connect_error", (error) => {
    onError?.(error);
  });

  return () => {
    socket.emit("notifications:unsubscribe", { profileId });
    socket.disconnect();
  };
}

export const updateCurrentProfile = withFallback(
  (data) => fetchJson("/api/profile/current", {
    method: "PUT",
    body: JSON.stringify(data),
  }),
  async (data) => {
    await delay();
    return { ...mockGetProfileById("user"), ...data };
  }
);

export const getDrafts = async () => {
  const drafts = localStorage.getItem("ziele_drafts");
  if (drafts) {
    return JSON.parse(drafts);
  }
  return [];
};

export const saveDraft = async (draft) => {
  const drafts = await getDrafts();
  const existingIndex = drafts.findIndex(d => d.id === draft.id);
  
  if (existingIndex >= 0) {
    drafts[existingIndex] = { ...drafts[existingIndex], ...draft, lastEdited: new Date().toISOString() };
  } else {
    drafts.push({ ...draft, id: `draft-${Date.now()}`, lastEdited: new Date().toISOString() });
  }
  
  localStorage.setItem("ziele_drafts", JSON.stringify(drafts));
  return drafts;
};

export const updatePost = withFallback(
  (id, data) => fetchJson(`/api/posts/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  }),
  async (id, data) => {
    await delay();
    return { id, ...data };
  }
);

export const deletePost = withFallback(
  (id) => fetchJson(`/api/posts/${id}`, {
    method: "DELETE",
  }),
  async () => {
    await delay();
    return true;
  }
);
