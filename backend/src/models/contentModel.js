import { prisma } from "./prismaClient.js";
import {
  estimateReadTime,
  formatCompactNumber,
  formatRelativeTime,
  normalizeHandle,
  stripHtml,
} from "../utils/contentUtils.js";

// ==============================================================
// PRISMA HELPER: Enriches DB output to match the expected format
// ==============================================================
function enrichPost(post) {
  if (!post) return null;
  const contentText = stripHtml(post.content || "");
  return {
    ...post,
    contentText,
    summary: contentText.slice(0, 160).trim(),
    time: formatRelativeTime(post.createdAt),
    readTime: estimateReadTime(post.content),
    comments: post._count?.comments || 0,
    viewsLabel: formatCompactNumber(post.views || 0),
  };
}

// ==============================================================
// POSTS
// ==============================================================
export async function getPosts() {
  const posts = await prisma.post.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { comments: true } } },
  });
  return posts.map(enrichPost);
}

export async function getPostById(id) {
  const post = await prisma.post.findUnique({
    where: { id: Number(id) },
    include: { _count: { select: { comments: true } } },
  });
  return enrichPost(post);
}

export async function createPost(input) {
  const title = String(input.title || "").trim();
  const content = String(input.content || "").trim();

  if (!title || !content) {
    throw new Error("Title and content are required");
  }

  const requestedProfileId = String(input.profileId || "").trim();
  const authorHandle = normalizeHandle(input.authorHandle || "@currentuser");

  // Link post to User Profile via ID or Handle
  let profile = await prisma.profile.findFirst({
    where: {
      OR: [{ id: requestedProfileId }, { handle: authorHandle }],
    },
  });

  // Fallback to first profile if none matched (prevents crashes during dev testing)
  if (!profile) {
    profile = await prisma.profile.findFirst();
  }

  if (!profile) {
    throw new Error("No profile found. Please sync Clerk user.");
  }

  const tags = Array.isArray(input.tags)
    ? input.tags.map((t) => String(t).trim()).filter(Boolean).slice(0, 8)
    : [];

  const post = await prisma.post.create({
    data: {
      profileId: profile.id,
      authorName: String(input.authorName || profile.name),
      authorHandle: String(input.authorHandle || profile.handle),
      avatar: String(input.avatar || profile.avatar),
      title,
      content,
      tags, // Prisma natively handles string arrays in PostgreSQL!
      coverUrl: String(input.coverUrl || "").trim(),
      language: String(input.language || "English"),
      premium: Boolean(input.premium),
    },
    include: { _count: { select: { comments: true } } },
  });

  return enrichPost(post);
}

export async function getRandomPost() {
  const count = await prisma.post.count();
  if (count === 0) return null;
  const skip = Math.floor(Math.random() * count);
  const post = await prisma.post.findFirst({
    skip,
    include: { _count: { select: { comments: true } } },
  });
  return enrichPost(post);
}

export async function getRelatedPosts(postId) {
  const current = await prisma.post.findUnique({
    where: { id: Number(postId) },
    select: { tags: true },
  });

  if (!current || !current.tags.length) return [];

  // Find posts sharing tags, sorted by popularity
  const related = await prisma.post.findMany({
    where: {
      id: { not: Number(postId) },
      tags: { hasSome: current.tags }, // Prisma array overlap checking
    },
    take: 3,
    orderBy: { likes: "desc" },
  });

  return related.map(enrichPost);
}

// ==============================================================
// COMMENTS
// ==============================================================
export async function getCommentsByPostId(postId) {
  const comments = await prisma.comment.findMany({
    where: { postId: Number(postId) },
    orderBy: { createdAt: "desc" },
  });
  
  return comments.map((c) => ({
    ...c,
    time: formatRelativeTime(c.createdAt),
  }));
}

export async function createComment(postId, input) {
  const content = String(input.content || "").trim();
  if (!content) throw new Error("Comment content is required");

  // Validate the parent post actually exists in DB
  const post = await prisma.post.findUnique({ where: { id: Number(postId) } });
  if (!post) throw new Error("Post not found");

  const comment = await prisma.comment.create({
    data: {
      postId: post.id,
      authorName: String(input.authorName || "You"),
      authorHandle: String(input.authorHandle || "@currentuser"),
      avatar: String(input.avatar || "YU"),
      content,
    },
  });

  return {
    ...comment,
    time: formatRelativeTime(comment.createdAt),
  };
}

export async function deleteCommentById(commentId) {
  try {
    await prisma.comment.delete({ where: { id: Number(commentId) } });
    return true;
  } catch {
    return false;
  }
}

// ==============================================================
// MISC STATS / PROFILES
// ==============================================================
export async function getNotifications() {
  return await prisma.notification.findMany({
    orderBy: { timestamp: "desc" },
  });
}

export async function getProfiles() {
  return await prisma.profile.findMany();
}

export async function getProfileById(profileId) {
  const normalized = normalizeHandle(profileId);
  const profile = await prisma.profile.findFirst({
    where: {
      OR: [{ id: profileId }, { handle: normalized }],
    },
  });

  if (!profile) return null;

  // Fetch the posts written by this profile
  const posts = await prisma.post.findMany({
    where: { profileId: profile.id },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { comments: true } } },
  });

  return {
    ...profile,
    posts: posts.map(enrichPost),
  };
}

// ==============================================================
// AGGREGATION / DISCOVER
// ==============================================================
export async function getSidebarData() {
  const posts = await prisma.post.findMany({
    select: { tags: true, views: true },
  });

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

  const profiles = await prisma.profile.findMany({ take: 4 });
  const suggestions = profiles.map((p) => ({
    name: p.name,
    handle: p.handle,
    avatar: p.avatar,
  }));

  return { trendingTopics, suggestions };
}

export async function getDiscoverData(query = {}) {
  const posts = await getPosts();

  const categories = ["Recommended", ...new Set(posts.flatMap((post) => post.tags))];

  const dbProfiles = await prisma.profile.findMany({ take: 4 });
  const creators = dbProfiles.map((p) => ({
    id: p.id,
    initials: p.avatar,
    name: p.name,
    handle: p.handle,
    note: p.bio,
    followers: formatCompactNumber(p.followers),
    posts: String(p.postsCount),
  }));

  const tagQuery = normalizeHandle(query.tag || "");
  const search = String(query.q || "").trim().toLowerCase();

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

      const matchesTag = !tagQuery || normalizeHandle(blog.category) === tagQuery;
      return matchesSearch && matchesTag;
    });

  return { categories, blogs, creators };
}
