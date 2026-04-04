import { readStore, withStore } from "../data/store.js";
import {
  estimateReadTime,
  formatCompactNumber,
  formatRelativeTime,
  normalizeHandle,
  stripHtml,
} from "../utils/contentUtils.js";

function nextId(items) {
  return (
    items.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) + 1
  );
}

function enrichPost(post, state) {
  const commentCount = state.comments.filter(
    (comment) => Number(comment.postId) === Number(post.id),
  ).length;
  return {
    ...post,
    contentText: stripHtml(post.content),
    summary: stripHtml(post.content).slice(0, 160).trim(),
    time: formatRelativeTime(post.createdAt),
    readTime: estimateReadTime(post.content),
    comments: commentCount,
    viewsLabel: formatCompactNumber(post.views || 0),
  };
}

function sortPosts(posts) {
  return [...posts].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function getPosts() {
  const state = readStore();
  return sortPosts(state.posts).map((post) => enrichPost(post, state));
}

export function getPostById(id) {
  const state = readStore();
  const post = state.posts.find((item) => Number(item.id) === Number(id));
  return post ? enrichPost(post, state) : null;
}

export function createPost(input) {
  const title = String(input.title || "").trim();
  const content = String(input.content || "").trim();

  if (!title || !content) {
    throw new Error("Title and content are required");
  }

  const state = withStore((draft) => {
    const requestedProfileId = String(input.profileId || "").trim();
    const authorHandle = normalizeHandle(input.authorHandle || "@currentuser");

    const profileById = requestedProfileId
      ? draft.profiles.find((item) => String(item.id) === requestedProfileId)
      : null;

    const profileByHandle = draft.profiles.find(
      (item) => normalizeHandle(item.handle) === authorHandle,
    );

    const profile = profileById || profileByHandle || draft.profiles[0];

    const tags = Array.isArray(input.tags)
      ? input.tags
          .map((tag) => String(tag).trim())
          .filter(Boolean)
          .slice(0, 8)
      : [];

    const createdPost = {
      id: nextId(draft.posts),
      profileId: profile?.id || requestedProfileId || "currentuser",
      avatar: String(input.avatar || profile?.avatar || "YU"),
      authorName: String(input.authorName || profile?.name || "You"),
      authorHandle: String(
        input.authorHandle || profile?.handle || "@currentuser",
      ),
      title,
      content,
      tags,
      likes: 0,
      dislikes: 0,
      bookmarks: 0,
      views: 1,
      coverUrl: String(input.coverUrl || "").trim(),
      language: String(input.language || "English"),
      premium: Boolean(input.premium),
      createdAt: new Date().toISOString(),
    };

    draft.posts.push(createdPost);
    return draft;
  });

  const created = state.posts[state.posts.length - 1];
  return enrichPost(created, state);
}

export function getRandomPost() {
  const posts = getPosts();
  if (posts.length === 0) return null;
  const index = Math.floor(Math.random() * posts.length);
  return posts[index];
}

export function getRelatedPosts(postId) {
  const posts = getPosts();
  const current = posts.find((post) => Number(post.id) === Number(postId));
  if (!current) return [];

  return posts
    .filter((post) => Number(post.id) !== Number(current.id))
    .map((post) => ({
      ...post,
      score: post.tags.filter((tag) => current.tags.includes(tag)).length,
    }))
    .sort((a, b) => b.score - a.score || b.likes - a.likes)
    .slice(0, 3)
    .map(({ score, ...post }) => post);
}

export function getCommentsByPostId(postId) {
  const state = readStore();
  return state.comments
    .filter((comment) => Number(comment.postId) === Number(postId))
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .map((comment) => ({
      ...comment,
      time: formatRelativeTime(comment.createdAt),
    }));
}

export function createComment(postId, input) {
  const content = String(input.content || "").trim();
  if (!content) {
    throw new Error("Comment content is required");
  }

  const nextState = withStore((draft) => {
    const post = draft.posts.find((item) => Number(item.id) === Number(postId));
    if (!post) {
      throw new Error("Post not found");
    }

    draft.comments.unshift({
      id: nextId(draft.comments),
      postId: Number(postId),
      authorName: String(input.authorName || "You"),
      authorHandle: String(input.authorHandle || "@currentuser"),
      avatar: String(input.avatar || "YU"),
      content,
      createdAt: new Date().toISOString(),
    });

    return draft;
  });

  const created = nextState.comments[0];
  return {
    ...created,
    time: formatRelativeTime(created.createdAt),
  };
}

export function deleteCommentById(commentId) {
  let deleted = false;

  withStore((draft) => {
    const index = draft.comments.findIndex(
      (item) => Number(item.id) === Number(commentId),
    );
    if (index !== -1) {
      draft.comments.splice(index, 1);
      deleted = true;
    }
    return draft;
  });

  return deleted;
}

export function getNotifications() {
  const state = readStore();
  return state.notifications
    .map((notification) => ({
      ...notification,
      timestamp: notification.timestamp || new Date().toISOString(),
    }))
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
}

export function getProfiles() {
  const state = readStore();
  return state.profiles;
}

export function getProfileById(profileId) {
  const state = readStore();
  const normalized = normalizeHandle(profileId || state.profiles[0]?.id || "");
  const profile =
    state.profiles.find((item) => normalizeHandle(item.id) === normalized) ||
    state.profiles.find(
      (item) => normalizeHandle(item.handle) === normalized,
    ) ||
    null;

  if (!profile) return null;

  const posts = sortPosts(state.posts)
    .filter(
      (post) =>
        normalizeHandle(post.authorHandle) === normalizeHandle(profile.handle),
    )
    .map((post) => enrichPost(post, state));

  return {
    ...profile,
    posts,
  };
}

export function getSidebarData() {
  const posts = getPosts();
  const tagCounts = new Map();

  posts.forEach((post) => {
    post.tags.forEach((tag) => {
      const current = tagCounts.get(tag) || 0;
      tagCounts.set(tag, current + (post.views || 0));
    });
  });

  const trendingTopics = [...tagCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([topic, score]) => ({
      topic,
      posts: score,
      tag: `#${topic.replace(/\s+/g, "")}`,
    }));

  const suggestions = getProfiles()
    .slice(0, 4)
    .map((profile) => ({
      name: profile.name,
      handle: profile.handle,
      avatar: profile.avatar,
    }));

  return {
    trendingTopics,
    suggestions,
  };
}

export function getDiscoverData(query = {}) {
  const posts = getPosts();
  const categories = [
    "Recommended",
    ...new Set(posts.flatMap((post) => post.tags)),
  ];
  const creators = getProfiles()
    .slice(0, 4)
    .map((profile) => ({
      id: profile.id,
      initials: profile.avatar,
      name: profile.name,
      handle: profile.handle,
      note: profile.bio,
      followers: formatCompactNumber(profile.followers),
      posts: String(profile.posts),
    }));

  const tagQuery = normalizeHandle(query.tag || "");
  const search = String(query.q || "")
    .trim()
    .toLowerCase();

  const blogs = posts
    .map((post) => ({
      id: post.id,
      title: post.title,
      summary: post.summary,
      author: post.authorName,
      category: post.tags[0] || "Recommended",
      views: formatCompactNumber(post.views || 0),
      readTime: post.readTime,
    }))
    .filter((blog) => {
      const matchesSearch =
        !search ||
        blog.title.toLowerCase().includes(search) ||
        blog.summary.toLowerCase().includes(search) ||
        blog.author.toLowerCase().includes(search) ||
        blog.category.toLowerCase().includes(search);

      const matchesTag =
        !tagQuery || normalizeHandle(blog.category) === tagQuery;
      return matchesSearch && matchesTag;
    });

  return {
    categories,
    blogs,
    creators,
  };
}
