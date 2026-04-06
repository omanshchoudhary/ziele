import { prisma } from "./prismaClient.js";
import {
  enforceContentSafety,
  estimateReadTime,
  formatCompactNumber,
  formatRelativeTime,
  normalizeHandle,
  normalizeTag,
  parsePostId,
  sanitizePlainText,
  sanitizeRichText,
  slugifyTitle,
  stripHtml,
} from "../utils/contentUtils.js";
import {
  detectMediaTypeFromUrl,
  validateExternalMediaUrl,
} from "../utils/mediaUtils.js";

function buildPostInclude(viewerProfileId = null) {
  return {
    _count: { select: { comments: true } },
    ...(viewerProfileId
      ? {
          reactions: {
            where: { profileId: viewerProfileId },
            select: { type: true },
            take: 1,
          },
          bookmarksRel: {
            where: { profileId: viewerProfileId },
            select: { profileId: true },
            take: 1,
          },
        }
      : {}),
  };
}

function normalizeMediaType(value = "") {
  const normalized = String(value).trim().toLowerCase();
  return normalized === "image" || normalized === "video" ? normalized : "";
}

async function getFollowingIdSet(viewerProfileId = null) {
  if (!viewerProfileId) return new Set();

  const rows = await prisma.follow.findMany({
    where: { followerId: viewerProfileId },
    select: { followingId: true },
  });

  return new Set(rows.map((row) => row.followingId));
}

function formatConnectionProfile(profile, viewerProfileId, followingSet) {
  return {
    id: profile.id,
    name: profile.name,
    handle: profile.handle,
    bio: profile.bio,
    avatar: profile.avatar,
    followers: profile.followersCount ?? profile.followers,
    following: profile.followingCount ?? profile.following,
    postsCount: profile.postsTotal ?? profile.postsCount,
    likes: profile.likesTotal ?? profile.likes,
    streak: profile.streak,
    isPremium: profile.isPremium,
    joined: profile.joined,
    streakMilestones: buildStreakMilestones(profile.streak),
    isFollowing: followingSet.has(profile.id),
    isOwnProfile: Boolean(viewerProfileId && viewerProfileId === profile.id),
  };
}

function buildStreakMilestones(streak = 0) {
  const value = Number(streak || 0);
  return [7, 30, 100].map((target) => ({
    target,
    reached: value >= target,
    remaining: value >= target ? 0 : target - value,
  }));
}

function createHttpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function dedupeTags(rawTags = []) {
  if (!Array.isArray(rawTags)) return [];

  const seen = new Set();
  const tags = [];

  for (const value of rawTags) {
    const normalized = normalizeTag(value).slice(0, 30);
    if (!normalized) continue;

    const key = normalized.toLowerCase();
    if (seen.has(key)) continue;

    seen.add(key);
    tags.push(normalized);

    if (tags.length >= 8) break;
  }

  return tags;
}

function startOfUtcDay(date) {
  const value = new Date(date);
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
}

function countUtcDayDiff(laterDate, earlierDate) {
  const later = startOfUtcDay(laterDate).getTime();
  const earlier = startOfUtcDay(earlierDate).getTime();
  return Math.floor((later - earlier) / (24 * 60 * 60 * 1000));
}

function scorePostForTrending(post, commentsCount = 0) {
  const createdAt = new Date(post.createdAt || Date.now());
  const ageHours = Math.max(1, (Date.now() - createdAt.getTime()) / (1000 * 60 * 60));
  const recencyBoost = 36 / (ageHours + 3);

  return (
    (post.likes || 0) * 4 +
    (post.dislikes || 0) * -1 +
    commentsCount * 5 +
    (post.bookmarks || 0) * 3 +
    (post.views || 0) * 0.15 +
    recencyBoost
  );
}

function enrichPost(post, viewerProfileId, followingSet) {
  if (!post) return null;

  const contentText = stripHtml(post.content || "");
  const mediaUrl = String(post.mediaUrl || post.coverUrl || "").trim();
  const mediaType =
    normalizeMediaType(post.mediaType) || detectMediaTypeFromUrl(mediaUrl);

  return {
    ...post,
    mediaUrl,
    mediaType,
    mediaSource: String(post.mediaSource || "").trim(),
    slug: slugifyTitle(post.title || ""),
    sharePath: `/post/${post.id}/${slugifyTitle(post.title || "")}`,
    contentText,
    summary: contentText.slice(0, 160).trim(),
    time: formatRelativeTime(post.createdAt),
    readTime: estimateReadTime(post.content),
    comments: post._count?.comments || 0,
    viewsLabel: formatCompactNumber(post.views || 0),
    isFollowingAuthor: Boolean(post.profileId && followingSet.has(post.profileId)),
    isOwnAuthor: Boolean(viewerProfileId && post.profileId === viewerProfileId),
    viewerReaction: post.reactions?.[0]?.type || null,
    isBookmarked: Boolean(post.bookmarksRel?.length),
  };
}

function resolveMediaPayload(input = {}) {
  const rawMediaUrl = String(input.mediaUrl || input.coverUrl || "").trim();
  if (!rawMediaUrl) {
    return {
      coverUrl: "",
      mediaUrl: "",
      mediaType: "",
      mediaSource: "",
    };
  }

  const validated = validateExternalMediaUrl(rawMediaUrl, input.mediaType);
  const mediaSource = String(input.mediaSource || "url").trim() || "url";

  return {
    coverUrl: validated.mediaType === "image" ? validated.url : "",
    mediaUrl: validated.url,
    mediaType: validated.mediaType,
    mediaSource,
  };
}

async function getProfileOrThrow(tx, profileId) {
  const profile = await tx.profile.findUnique({
    where: { id: profileId },
  });

  if (!profile) {
    throw new Error("Profile not found");
  }

  return profile;
}

// ==============================================================
// POSTS
// ==============================================================
export async function getPosts(viewerProfileId = null) {
  const [posts, followingSet] = await Promise.all([
    prisma.post.findMany({
      orderBy: { createdAt: "desc" },
      include: buildPostInclude(viewerProfileId),
    }),
    getFollowingIdSet(viewerProfileId),
  ]);

  return posts.map((post) => enrichPost(post, viewerProfileId, followingSet));
}

export async function getPostById(id, viewerProfileId = null) {
  const parsedPostId = parsePostId(id);
  if (!Number.isFinite(parsedPostId)) return null;

  const [post, followingSet] = await Promise.all([
    prisma.post
      .update({
        where: { id: parsedPostId },
        data: { views: { increment: 1 } },
        include: buildPostInclude(viewerProfileId),
      })
      .catch(() => null),
    getFollowingIdSet(viewerProfileId),
  ]);

  return enrichPost(post, viewerProfileId, followingSet);
}

export async function createPost(input) {
  const title = sanitizePlainText(input.title || "").slice(0, 120);
  const content = sanitizeRichText(input.content || "");

  if (!title || !content) {
    throw new Error("Title and content are required");
  }

  enforceContentSafety({ title, text: content });

  const requestedProfileId = String(input.profileId || "").trim();
  const authorHandle = normalizeHandle(input.authorHandle || "@currentuser");

  let profile = await prisma.profile.findFirst({
    where: {
      OR: [{ id: requestedProfileId }, { handle: authorHandle }],
    },
  });

  if (!profile) {
    profile = await prisma.profile.findFirst();
  }

  if (!profile) {
    throw new Error("No profile found. Please sync Clerk user.");
  }

  const tags = dedupeTags(input.tags || []);
  const media = resolveMediaPayload(input);

  const post = await prisma.$transaction(async (tx) => {
    const created = await tx.post.create({
      data: {
        profileId: profile.id,
        authorName: String(input.authorName || profile.name),
        authorHandle: String(input.authorHandle || profile.handle),
        avatar: String(input.avatar || profile.avatar),
        title,
        content,
        tags,
        coverUrl: media.coverUrl,
        mediaUrl: media.mediaUrl,
        mediaType: media.mediaType,
        mediaSource: media.mediaSource,
        language: sanitizePlainText(input.language || "English").slice(0, 24),
        premium: Boolean(input.premium || profile.isPremium),
      },
      include: buildPostInclude(profile.id),
    });

    // We keep denormalized counts on Profile so list UIs stay cheap to render.
    await tx.profile.update({
      where: { id: profile.id },
      data: {
        postsCount: { increment: 1 },
      },
    });

    return created;
  });

  return enrichPost(post, profile.id, new Set());
}

export async function updatePostById(postId, input, requesterProfileId) {
  const parsedPostId = parsePostId(postId);
  if (!Number.isFinite(parsedPostId)) {
    throw createHttpError(400, "Invalid post id.");
  }

  if (!requesterProfileId) {
    throw createHttpError(401, "Unauthorized.");
  }

  const existing = await prisma.post.findUnique({
    where: { id: parsedPostId },
    select: { id: true, profileId: true },
  });

  if (!existing) {
    throw createHttpError(404, "Post not found.");
  }

  if (existing.profileId !== requesterProfileId) {
    throw createHttpError(403, "You can only edit your own posts.");
  }

  const data = {};

  if (Object.prototype.hasOwnProperty.call(input, "title")) {
    const title = sanitizePlainText(input.title || "").slice(0, 120);
    if (!title) {
      throw createHttpError(400, "Title is required.");
    }
    data.title = title;
  }

  if (Object.prototype.hasOwnProperty.call(input, "content")) {
    const content = sanitizeRichText(input.content || "");
    if (!stripHtml(content)) {
      throw createHttpError(400, "Content is required.");
    }
    data.content = content;
  }

  if (Object.prototype.hasOwnProperty.call(input, "tags")) {
    data.tags = dedupeTags(input.tags || []);
  }

  const hasMediaInput =
    Object.prototype.hasOwnProperty.call(input, "mediaUrl") ||
    Object.prototype.hasOwnProperty.call(input, "coverUrl") ||
    Object.prototype.hasOwnProperty.call(input, "mediaType") ||
    Object.prototype.hasOwnProperty.call(input, "mediaSource");

  if (hasMediaInput) {
    Object.assign(data, resolveMediaPayload(input));
  }

  if (Object.prototype.hasOwnProperty.call(input, "language")) {
    data.language = sanitizePlainText(input.language || "English").slice(0, 24);
  }

  if (Object.prototype.hasOwnProperty.call(input, "premium")) {
    const owner = await prisma.profile.findUnique({
      where: { id: requesterProfileId },
      select: { isPremium: true },
    });
    data.premium = Boolean(input.premium && owner?.isPremium);
  }

  if (data.title || data.content) {
    enforceContentSafety({
      title: data.title || input.title || "",
      text: data.content || input.content || "",
    });
  }

  const [updatedPost, followingSet] = await Promise.all([
    prisma.post.update({
      where: { id: parsedPostId },
      data,
      include: buildPostInclude(requesterProfileId),
    }),
    getFollowingIdSet(requesterProfileId),
  ]);

  return enrichPost(updatedPost, requesterProfileId, followingSet);
}

export async function deletePostById(postId, requesterProfileId) {
  const parsedPostId = parsePostId(postId);
  if (!Number.isFinite(parsedPostId)) {
    throw createHttpError(400, "Invalid post id.");
  }

  if (!requesterProfileId) {
    throw createHttpError(401, "Unauthorized.");
  }

  const post = await prisma.post.findUnique({
    where: { id: parsedPostId },
    select: { id: true, profileId: true },
  });

  if (!post) {
    throw createHttpError(404, "Post not found.");
  }

  if (post.profileId !== requesterProfileId) {
    throw createHttpError(403, "You can only delete your own posts.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.post.delete({
      where: { id: parsedPostId },
    });

    await tx.profile.update({
      where: { id: requesterProfileId },
      data: {
        postsCount: {
          decrement: 1,
        },
      },
    });
  });

  return true;
}

export async function getRandomPost(viewerProfileId = null) {
  const count = await prisma.post.count();
  if (count === 0) return null;

  const [followingSet, post] = await Promise.all([
    getFollowingIdSet(viewerProfileId),
    prisma.post.findFirst({
      skip: Math.floor(Math.random() * count),
      include: buildPostInclude(viewerProfileId),
    }),
  ]);

  return enrichPost(post, viewerProfileId, followingSet);
}

export async function getRelatedPosts(postId, viewerProfileId = null) {
  const parsedPostId = parsePostId(postId);
  if (!Number.isFinite(parsedPostId)) return [];

  const current = await prisma.post.findUnique({
    where: { id: parsedPostId },
    select: { tags: true },
  });

  if (!current || !current.tags.length) return [];

  const [related, followingSet] = await Promise.all([
    prisma.post.findMany({
      where: {
        id: { not: parsedPostId },
        tags: { hasSome: current.tags },
      },
      take: 3,
      orderBy: { likes: "desc" },
      include: buildPostInclude(viewerProfileId),
    }),
    getFollowingIdSet(viewerProfileId),
  ]);

  return related.map((post) => enrichPost(post, viewerProfileId, followingSet));
}

// ==============================================================
// COMMENTS
// ==============================================================
export async function getCommentsByPostId(postId) {
  const parsedPostId = parsePostId(postId);
  if (!Number.isFinite(parsedPostId)) return [];

  const comments = await prisma.comment.findMany({
    where: { postId: parsedPostId },
    orderBy: { createdAt: "desc" },
  });

  return comments.map((comment) => ({
    ...comment,
    time: formatRelativeTime(comment.createdAt),
  }));
}

export async function createComment(postId, input) {
  const parsedPostId = parsePostId(postId);
  if (!Number.isFinite(parsedPostId)) {
    throw createHttpError(400, "Invalid post id.");
  }

  const content = sanitizePlainText(input.content || "");
  if (!content) throw new Error("Comment content is required");

  const post = await prisma.post.findUnique({ where: { id: parsedPostId } });
  if (!post) throw new Error("Post not found");

  enforceContentSafety({ title: post.title, text: content });

  const comment = await prisma.comment.create({
    data: {
      postId: post.id,
      profileId: String(input.profileId || "").trim() || undefined,
      authorName: sanitizePlainText(input.authorName || "You").slice(0, 60),
      authorHandle: String(input.authorHandle || "@currentuser"),
      avatar: sanitizePlainText(input.avatar || "YU").slice(0, 8),
      content,
    },
  });

  return {
    ...comment,
    time: formatRelativeTime(comment.createdAt),
  };
}

export async function getPostOwnerProfile(postId) {
  const parsedPostId = parsePostId(postId);
  if (!Number.isFinite(parsedPostId)) return null;

  return prisma.post.findUnique({
    where: { id: parsedPostId },
    select: {
      id: true,
      title: true,
      profileId: true,
      authorName: true,
      authorHandle: true,
    },
  });
}

export async function deleteCommentById(commentId, requesterProfileId) {
  const parsedCommentId = parsePostId(commentId);

  if (!Number.isFinite(parsedCommentId)) {
    throw createHttpError(400, "Invalid comment id.");
  }

  if (!requesterProfileId) {
    throw createHttpError(401, "Unauthorized.");
  }

  const comment = await prisma.comment.findUnique({
    where: { id: parsedCommentId },
    select: { id: true, profileId: true },
  });

  if (!comment) {
    return false;
  }

  if (comment.profileId && comment.profileId !== requesterProfileId) {
    throw createHttpError(403, "You can only delete your own comments.");
  }

  try {
    await prisma.comment.delete({ where: { id: parsedCommentId } });
    return true;
  } catch {
    return false;
  }
}

export async function toggleReaction(postId, profileId, type) {
  const normalizedType = String(type || "").trim().toLowerCase();
  if (!["like", "dislike"].includes(normalizedType)) {
    throw new Error("Reaction type must be like or dislike.");
  }

  const parsedPostId = parsePostId(postId);
  if (!Number.isFinite(parsedPostId)) {
    throw createHttpError(400, "Invalid post id.");
  }

  const post = await prisma.post.findUnique({
    where: { id: parsedPostId },
    select: { id: true, profileId: true, title: true },
  });

  if (!post) {
    throw new Error("Post not found");
  }

  const followingSet = await getFollowingIdSet(profileId);

  return prisma.$transaction(async (tx) => {
    const existing = await tx.reaction.findUnique({
      where: {
        postId_profileId: {
          postId: post.id,
          profileId,
        },
      },
    });

    let nextReaction = normalizedType;
    const counters = {
      likes: 0,
      dislikes: 0,
    };

    if (existing?.type === normalizedType) {
      await tx.reaction.delete({
        where: {
          postId_profileId: {
            postId: post.id,
            profileId,
          },
        },
      });
      nextReaction = null;
      counters[normalizedType === "like" ? "likes" : "dislikes"] -= 1;
    } else if (existing) {
      await tx.reaction.update({
        where: {
          postId_profileId: {
            postId: post.id,
            profileId,
          },
        },
        data: {
          type: normalizedType,
        },
      });
      counters[existing.type === "like" ? "likes" : "dislikes"] -= 1;
      counters[normalizedType === "like" ? "likes" : "dislikes"] += 1;
    } else {
      await tx.reaction.create({
        data: {
          postId: post.id,
          profileId,
          type: normalizedType,
        },
      });
      counters[normalizedType === "like" ? "likes" : "dislikes"] += 1;
    }

    const updatedPost = await tx.post.update({
      where: { id: post.id },
      data: {
        likes: { increment: counters.likes },
        dislikes: { increment: counters.dislikes },
      },
      include: buildPostInclude(profileId),
    });

    return {
      post: enrichPost(updatedPost, profileId, followingSet),
      reaction: nextReaction,
    };
  });
}

export async function toggleBookmark(postId, profileId) {
  const parsedPostId = parsePostId(postId);
  if (!Number.isFinite(parsedPostId)) {
    throw createHttpError(400, "Invalid post id.");
  }

  if (!profileId) {
    throw createHttpError(401, "Unauthorized.");
  }

  const existingPost = await prisma.post.findUnique({
    where: { id: parsedPostId },
    select: { id: true },
  });

  if (!existingPost) {
    throw createHttpError(404, "Post not found.");
  }

  const followingSet = await getFollowingIdSet(profileId);

  return prisma.$transaction(async (tx) => {
    const existingBookmark = await tx.bookmark.findUnique({
      where: {
        postId_profileId: {
          postId: parsedPostId,
          profileId,
        },
      },
    });

    let bookmarked = true;
    if (existingBookmark) {
      await tx.bookmark.delete({
        where: {
          postId_profileId: {
            postId: parsedPostId,
            profileId,
          },
        },
      });
      bookmarked = false;
    } else {
      await tx.bookmark.create({
        data: {
          postId: parsedPostId,
          profileId,
        },
      });
    }

    const bookmarkCount = await tx.bookmark.count({
      where: { postId: parsedPostId },
    });

    const updatedPost = await tx.post.update({
      where: { id: parsedPostId },
      data: {
        bookmarks: bookmarkCount,
      },
      include: buildPostInclude(profileId),
    });

    return {
      bookmarked,
      post: enrichPost(updatedPost, profileId, followingSet),
    };
  });
}

export async function getBookmarkedPosts(profileId) {
  if (!profileId) {
    return [];
  }

  const followingSet = await getFollowingIdSet(profileId);
  const bookmarks = await prisma.bookmark.findMany({
    where: { profileId },
    orderBy: { createdAt: "desc" },
    include: {
      post: {
        include: buildPostInclude(profileId),
      },
    },
  });

  return bookmarks
    .filter((bookmark) => Boolean(bookmark.post))
    .map((bookmark) => ({
      ...enrichPost(bookmark.post, profileId, followingSet),
      savedAt: bookmark.createdAt,
    }));
}

// ==============================================================
// PROFILES / FOLLOWS
// ==============================================================
export async function getNotifications() {
  return prisma.notification.findMany({
    orderBy: { timestamp: "desc" },
  });
}

export async function getProfiles(viewerProfileId = null) {
  const [profiles, followingSet] = await Promise.all([
    prisma.profile.findMany({
      orderBy: { followers: "desc" },
    }),
    getFollowingIdSet(viewerProfileId),
  ]);

  return profiles.map((profile) =>
    formatConnectionProfile(profile, viewerProfileId, followingSet),
  );
}

export async function touchDailyStreak(profileId) {
  if (!profileId) return null;

  const profile = await prisma.profile.findUnique({
    where: { id: profileId },
    select: { id: true, streak: true, lastActiveAt: true },
  });

  if (!profile) return null;

  const now = new Date();

  if (!profile.lastActiveAt) {
    return prisma.profile.update({
      where: { id: profileId },
      data: {
        streak: Math.max(1, profile.streak || 0),
        lastActiveAt: now,
      },
    });
  }

  const dayDiff = countUtcDayDiff(now, profile.lastActiveAt);

  if (dayDiff <= 0) {
    return prisma.profile.findUnique({ where: { id: profileId } });
  }

  const nextStreak = dayDiff === 1 ? (profile.streak || 0) + 1 : 1;

  return prisma.profile.update({
    where: { id: profileId },
    data: {
      streak: nextStreak,
      lastActiveAt: now,
    },
  });
}

export async function getProfileById(profileId, viewerProfileId = null) {
  const normalized = normalizeHandle(profileId);

  const profile = await prisma.profile.findFirst({
    where: {
      OR: [{ id: profileId }, { handle: normalized }],
    },
  });

  if (!profile) return null;

  const [posts, followerLinks, followingLinks, followingSet] = await Promise.all([
    prisma.post.findMany({
      where: { profileId: profile.id },
      orderBy: { createdAt: "desc" },
      include: buildPostInclude(viewerProfileId),
    }),
    prisma.follow.findMany({
      where: { followingId: profile.id },
      include: { follower: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.follow.findMany({
      where: { followerId: profile.id },
      include: { following: true },
      orderBy: { createdAt: "desc" },
    }),
    getFollowingIdSet(viewerProfileId),
  ]);

  return {
    ...formatConnectionProfile(profile, viewerProfileId, followingSet),
    posts: posts.map((post) => enrichPost(post, viewerProfileId, followingSet)),
    postsTotal: posts.length,
    followers: followerLinks.length,
    following: followingLinks.length,
    likes: posts.reduce((sum, post) => sum + (post.likes || 0), 0),
    followersList: followerLinks.map((link) =>
      formatConnectionProfile(link.follower, viewerProfileId, followingSet),
    ),
    followingList: followingLinks.map((link) =>
      formatConnectionProfile(link.following, viewerProfileId, followingSet),
    ),
  };
}

export async function followProfileByIds(followerId, followingId) {
  if (!followerId || !followingId) {
    throw new Error("Missing follower or following profile ID.");
  }

  if (followerId === followingId) {
    throw new Error("You cannot follow your own profile.");
  }

  return prisma.$transaction(async (tx) => {
    await Promise.all([
      getProfileOrThrow(tx, followerId),
      getProfileOrThrow(tx, followingId),
    ]);

    const existingFollow = await tx.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    if (existingFollow) {
      return false;
    }

    await tx.follow.create({
      data: {
        followerId,
        followingId,
      },
    });

    // We update the cached counts in the same transaction so profile reads stay consistent.
    await Promise.all([
      tx.profile.update({
        where: { id: followerId },
        data: { following: { increment: 1 } },
      }),
      tx.profile.update({
        where: { id: followingId },
        data: { followers: { increment: 1 } },
      }),
    ]);

    return true;
  });
}

export async function unfollowProfileByIds(followerId, followingId) {
  if (!followerId || !followingId) {
    throw new Error("Missing follower or following profile ID.");
  }

  if (followerId === followingId) {
    throw new Error("You cannot unfollow your own profile.");
  }

  return prisma.$transaction(async (tx) => {
    const existingFollow = await tx.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    if (!existingFollow) {
      return false;
    }

    await tx.follow.delete({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    await Promise.all([
      tx.profile.update({
        where: { id: followerId },
        data: { following: { decrement: 1 } },
      }),
      tx.profile.update({
        where: { id: followingId },
        data: { followers: { decrement: 1 } },
      }),
    ]);

    return true;
  });
}

// ==============================================================
// DISCOVER / SIDEBAR
// ==============================================================
export async function getSidebarData(viewerProfileId = null) {
  const [posts, profiles, followingSet] = await Promise.all([
    prisma.post.findMany({
      select: {
        tags: true,
        views: true,
        likes: true,
        dislikes: true,
        bookmarks: true,
        createdAt: true,
        _count: { select: { comments: true } },
      },
    }),
    prisma.profile.findMany({
      where: viewerProfileId ? { id: { not: viewerProfileId } } : undefined,
      orderBy: { followers: "desc" },
      take: 4,
    }),
    getFollowingIdSet(viewerProfileId),
  ]);

  const tagCounts = new Map();
  posts.forEach((post) => {
    post.tags.forEach((tag) => {
      const current = tagCounts.get(tag) || { score: 0, posts: 0 };
      const score = scorePostForTrending(post, post._count?.comments || 0);
      tagCounts.set(tag, {
        score: current.score + score,
        posts: current.posts + 1,
      });
    });
  });

  const trendingTopics = [...tagCounts.entries()]
    .sort((a, b) => b[1].score - a[1].score)
    .slice(0, 4)
    .map(([topic, metrics]) => ({
      topic,
      posts: metrics.posts,
      tag: `#${topic.replace(/\s+/g, "")}`,
    }));

  const suggestions = profiles.map((profile) => ({
    id: profile.id,
    name: profile.name,
    handle: profile.handle,
    avatar: profile.avatar,
    followers: profile.followers,
    isFollowing: followingSet.has(profile.id),
    isOwnProfile: Boolean(viewerProfileId && viewerProfileId === profile.id),
  }));

  return { trendingTopics, suggestions };
}

function buildPreferredTagScores(rows = []) {
  const scores = new Map();

  rows.forEach((row) => {
    (row.tags || []).forEach((tag) => {
      const normalized = normalizeTag(tag).toLowerCase();
      if (!normalized) return;
      scores.set(normalized, (scores.get(normalized) || 0) + 1);
    });
  });

  return scores;
}

async function getViewerPreferredTagScores(viewerProfileId) {
  if (!viewerProfileId) return new Map();

  const [ownPosts, bookmarkedPosts, reactedPosts] = await Promise.all([
    prisma.post.findMany({
      where: { profileId: viewerProfileId },
      select: { tags: true },
      take: 80,
    }),
    prisma.bookmark.findMany({
      where: { profileId: viewerProfileId },
      include: {
        post: {
          select: { tags: true },
        },
      },
      take: 80,
    }),
    prisma.reaction.findMany({
      where: { profileId: viewerProfileId },
      include: {
        post: {
          select: { tags: true },
        },
      },
      take: 120,
    }),
  ]);

  const bookmarkTagRows = bookmarkedPosts.map((item) => item.post).filter(Boolean);
  const reactionTagRows = reactedPosts.map((item) => item.post).filter(Boolean);

  return buildPreferredTagScores([
    ...ownPosts,
    ...bookmarkTagRows,
    ...reactionTagRows,
  ]);
}

function scoreRecommendation(post, preferredTagScores, followedSet, viewerProfileId) {
  if (!post) return 0;

  const commentsCount = post._count?.comments || 0;
  const baseScore = scorePostForTrending(post, commentsCount);
  const fromFollowedAuthor = followedSet.has(post.profileId) ? 16 : 0;
  const ownPostPenalty = viewerProfileId && post.profileId === viewerProfileId ? -100 : 0;

  const tagBoost = (post.tags || []).reduce((total, tag) => {
    const normalized = normalizeTag(tag).toLowerCase();
    return total + (preferredTagScores.get(normalized) || 0) * 5;
  }, 0);

  return baseScore + fromFollowedAuthor + tagBoost + ownPostPenalty;
}

export async function getRecommendationsData(viewerProfileId = null, query = {}) {
  const limit = Math.max(4, Math.min(30, Number(query.limit || 12)));

  const [posts, followedSet, preferredTagScores] = await Promise.all([
    prisma.post.findMany({
      include: buildPostInclude(viewerProfileId),
      take: 220,
      orderBy: { createdAt: "desc" },
    }),
    getFollowingIdSet(viewerProfileId),
    getViewerPreferredTagScores(viewerProfileId),
  ]);

  return posts
    .map((post) => ({
      post,
      score: scoreRecommendation(post, preferredTagScores, followedSet, viewerProfileId),
    }))
    .filter((entry) => entry.score > -50)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => enrichPost(entry.post, viewerProfileId, followedSet));
}

export async function getTrendingData(query = {}, viewerProfileId = null) {
  const limit = Math.max(5, Math.min(50, Number(query.limit || 20)));
  const search = String(query.q || "").trim().toLowerCase();
  const tagQuery = normalizeTag(query.tag || "").toLowerCase();

  const [posts, followingSet] = await Promise.all([
    prisma.post.findMany({
      include: buildPostInclude(viewerProfileId),
      take: 260,
      orderBy: { createdAt: "desc" },
    }),
    getFollowingIdSet(viewerProfileId),
  ]);

  const filtered = posts.filter((post) => {
    const title = (post.title || "").toLowerCase();
    const summary = stripHtml(post.content || "").toLowerCase();
    const author = (post.authorName || "").toLowerCase();
    const matchesSearch =
      !search ||
      title.includes(search) ||
      summary.includes(search) ||
      author.includes(search);

    const matchesTag =
      !tagQuery ||
      (post.tags || []).some((tag) => normalizeTag(tag).toLowerCase() === tagQuery);

    return matchesSearch && matchesTag;
  });

  const rankedEntries = filtered
    .map((post) => ({
      post,
      score: scorePostForTrending(post, post._count?.comments || 0),
    }))
    .sort((a, b) => b.score - a.score);

  const rankedPosts = rankedEntries.slice(0, limit).map((entry, index) => ({
    ...enrichPost(entry.post, viewerProfileId, followingSet),
    trendScore: Number(entry.score.toFixed(2)),
    trendRank: index + 1,
  }));

  const tagScores = new Map();
  const authorScores = new Map();

  rankedEntries.forEach(({ post, score }) => {
    (post.tags || []).forEach((tag) => {
      tagScores.set(tag, (tagScores.get(tag) || 0) + score);
    });

    const current = authorScores.get(post.profileId) || {
      id: post.profileId,
      name: post.authorName,
      handle: post.authorHandle,
      avatar: post.avatar,
      score: 0,
      posts: 0,
    };

    current.score += score;
    current.posts += 1;
    authorScores.set(post.profileId, current);
  });

  const topics = [...tagScores.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([topic, score]) => ({
      topic,
      tag: `#${normalizeTag(topic)}`,
      score: Number(score.toFixed(2)),
    }));

  const authors = [...authorScores.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map((author) => ({
      ...author,
      score: Number(author.score.toFixed(2)),
      isFollowing: followingSet.has(author.id),
      isOwnProfile: Boolean(viewerProfileId && author.id === viewerProfileId),
    }));

  return {
    topics,
    posts: rankedPosts,
    authors,
  };
}

export async function getCommunitiesData(query = {}) {
  const search = String(query.q || "").trim().toLowerCase();
  const tagFilter = normalizeTag(query.tag || "").toLowerCase();

  const posts = await prisma.post.findMany({
    select: {
      id: true,
      profileId: true,
      tags: true,
      views: true,
      likes: true,
      dislikes: true,
      bookmarks: true,
      createdAt: true,
      _count: { select: { comments: true } },
    },
  });

  const groups = new Map();

  posts.forEach((post) => {
    (post.tags || []).forEach((rawTag) => {
      const tag = normalizeTag(rawTag);
      if (!tag) return;

      const key = tag.toLowerCase();
      const existing = groups.get(key) || {
        id: key,
        name: `${tag} Community`,
        category: tag,
        description: `A community for writers and readers interested in ${tag}.`,
        posts: 0,
        membersSet: new Set(),
        views: 0,
        likes: 0,
        comments: 0,
        tags: new Set(),
        trendScore: 0,
      };

      existing.posts += 1;
      existing.membersSet.add(post.profileId);
      existing.views += post.views || 0;
      existing.likes += post.likes || 0;
      existing.comments += post._count?.comments || 0;
      existing.tags.add(tag);
      existing.trendScore += scorePostForTrending(post, post._count?.comments || 0);

      groups.set(key, existing);
    });
  });

  const communities = [...groups.values()]
    .map((group) => ({
      id: group.id,
      name: group.name,
      category: group.category,
      description: group.description,
      posts: group.posts,
      members: group.membersSet.size * 11 + Math.floor(group.likes / 3),
      views: group.views,
      likes: group.likes,
      comments: group.comments,
      trendScore: Number(group.trendScore.toFixed(2)),
      tags: [...group.tags].slice(0, 4),
    }))
    .filter((community) => {
      const matchesSearch =
        !search ||
        community.name.toLowerCase().includes(search) ||
        community.description.toLowerCase().includes(search) ||
        community.category.toLowerCase().includes(search) ||
        community.tags.some((tag) => tag.toLowerCase().includes(search));

      const matchesTag =
        !tagFilter ||
        community.category.toLowerCase() === tagFilter ||
        community.tags.some((tag) => tag.toLowerCase() === tagFilter);

      return matchesSearch && matchesTag;
    })
    .sort((a, b) => b.trendScore - a.trendScore);

  return {
    communities,
    categories: ["Recommended", ...new Set(communities.map((item) => item.category))],
  };
}

export async function getAnalyticsData(profileId, query = {}) {
  if (!profileId) {
    throw createHttpError(401, "Unauthorized.");
  }

  const rangeDays = [7, 30, 90].includes(Number(query.range || 30))
    ? Number(query.range || 30)
    : 30;

  const since = new Date(Date.now() - rangeDays * 24 * 60 * 60 * 1000);
  const profile = await prisma.profile.findUnique({
    where: { id: profileId },
    select: {
      id: true,
      followers: true,
      following: true,
      streak: true,
    },
  });

  if (!profile) {
    throw createHttpError(404, "Profile not found.");
  }

  const posts = await prisma.post.findMany({
    where: { profileId },
    select: {
      id: true,
      title: true,
      createdAt: true,
      views: true,
      likes: true,
      dislikes: true,
      bookmarks: true,
      _count: { select: { comments: true } },
    },
  });

  const postIds = posts.map((post) => post.id);

  const [commentsInRange, reactionsInRange] = await Promise.all([
    postIds.length
      ? prisma.comment.findMany({
          where: {
            postId: { in: postIds },
            createdAt: { gte: since },
          },
          select: { createdAt: true },
        })
      : [],
    postIds.length
      ? prisma.reaction.findMany({
          where: {
            postId: { in: postIds },
            createdAt: { gte: since },
          },
          select: { createdAt: true, type: true },
        })
      : [],
  ]);

  const seriesMap = new Map();
  for (let i = 0; i < rangeDays; i += 1) {
    const day = new Date(since.getTime() + i * 24 * 60 * 60 * 1000);
    const key = startOfUtcDay(day).toISOString().slice(0, 10);
    seriesMap.set(key, {
      date: key,
      views: 0,
      likes: 0,
      dislikes: 0,
      comments: 0,
    });
  }

  posts.forEach((post) => {
    const key = startOfUtcDay(post.createdAt).toISOString().slice(0, 10);
    const item = seriesMap.get(key);
    if (!item) return;

    // We attribute current post views to publish day as a trend proxy
    // until dedicated view-event tracking is added.
    item.views += post.views || 0;
  });

  commentsInRange.forEach((comment) => {
    const key = startOfUtcDay(comment.createdAt).toISOString().slice(0, 10);
    const item = seriesMap.get(key);
    if (!item) return;
    item.comments += 1;
  });

  reactionsInRange.forEach((reaction) => {
    const key = startOfUtcDay(reaction.createdAt).toISOString().slice(0, 10);
    const item = seriesMap.get(key);
    if (!item) return;

    if (reaction.type === "dislike") {
      item.dislikes += 1;
    } else {
      item.likes += 1;
    }
  });

  const totals = {
    posts: posts.length,
    views: posts.reduce((sum, post) => sum + (post.views || 0), 0),
    likes: posts.reduce((sum, post) => sum + (post.likes || 0), 0),
    dislikes: posts.reduce((sum, post) => sum + (post.dislikes || 0), 0),
    bookmarks: posts.reduce((sum, post) => sum + (post.bookmarks || 0), 0),
    comments: posts.reduce((sum, post) => sum + (post._count?.comments || 0), 0),
    followers: profile.followers || 0,
    streak: profile.streak || 0,
  };

  const topPosts = posts
    .map((post) => ({
      id: post.id,
      title: post.title,
      views: post.views || 0,
      likes: post.likes || 0,
      dislikes: post.dislikes || 0,
      comments: post._count?.comments || 0,
      score: Number(scorePostForTrending(post, post._count?.comments || 0).toFixed(2)),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  return {
    range: rangeDays,
    generatedAt: new Date().toISOString(),
    totals,
    streakMilestones: buildStreakMilestones(profile.streak),
    series: [...seriesMap.values()],
    topPosts,
  };
}

export async function getDiscoverData(query = {}, viewerProfileId = null) {
  const tagQueries = String(query.tag || "")
    .split(",")
    .map((tag) => normalizeTag(tag).toLowerCase())
    .filter(Boolean);
  const search = String(query.q || "").trim().toLowerCase();

  const [posts, dbProfiles, followingSet] = await Promise.all([
    prisma.post.findMany({
      include: buildPostInclude(viewerProfileId),
      orderBy: { createdAt: "desc" },
      take: 160,
    }),
    prisma.profile.findMany({
      where: viewerProfileId ? { id: { not: viewerProfileId } } : undefined,
      orderBy: { followers: "desc" },
      take: 6,
    }),
    getFollowingIdSet(viewerProfileId),
  ]);

  const enrichedPosts = posts.map((post) =>
    enrichPost(post, viewerProfileId, followingSet),
  );

  const categories = [
    "Recommended",
    ...new Set(
      enrichedPosts
        .flatMap((post) => post.tags || [])
        .map((tag) => normalizeTag(tag))
        .filter(Boolean),
    ),
  ];

  const creators = dbProfiles.map((profile) => ({
    id: profile.id,
    initials: profile.avatar,
    name: profile.name,
    handle: profile.handle,
    note: profile.bio,
    followers: formatCompactNumber(profile.followers),
    posts: String(profile.postsCount),
    isFollowing: followingSet.has(profile.id),
    isOwnProfile: Boolean(viewerProfileId && viewerProfileId === profile.id),
  }));

  const blogs = enrichedPosts
    .map((post) => ({
      id: post.id,
      profileId: post.profileId,
      title: post.title,
      summary: post.summary,
      author: post.authorName,
      authorHandle: post.authorHandle,
      time: post.time,
      category: post.tags?.[0] || "Recommended",
      tags: post.tags || [],
      views: formatCompactNumber(post.views || 0),
      readTime: post.readTime,
      isFollowingAuthor: post.isFollowingAuthor,
      isOwnAuthor: post.isOwnAuthor,
      isBookmarked: post.isBookmarked,
    }))
    .filter((blog) => {
      const matchesSearch =
        !search ||
        blog.title.toLowerCase().includes(search) ||
        blog.summary.toLowerCase().includes(search) ||
        blog.author.toLowerCase().includes(search) ||
        blog.category.toLowerCase().includes(search) ||
        blog.tags.some((tag) => normalizeTag(tag).toLowerCase().includes(search));

      const matchesTag =
        tagQueries.length === 0 ||
        blog.tags.some((tag) =>
          tagQueries.includes(normalizeTag(tag).toLowerCase()),
        );

      return matchesSearch && matchesTag;
    });

  return { categories, blogs, creators };
}
