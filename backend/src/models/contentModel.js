import { prisma } from "./prismaClient.js";
import {
  estimateReadTime,
  formatCompactNumber,
  formatRelativeTime,
  normalizeHandle,
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
    followers: profile.followers,
    following: profile.following,
    postsCount: profile.postsCount,
    likes: profile.likes,
    streak: profile.streak,
    isPremium: profile.isPremium,
    joined: profile.joined,
    isFollowing: followingSet.has(profile.id),
    isOwnProfile: Boolean(viewerProfileId && viewerProfileId === profile.id),
  };
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
    contentText,
    summary: contentText.slice(0, 160).trim(),
    time: formatRelativeTime(post.createdAt),
    readTime: estimateReadTime(post.content),
    comments: post._count?.comments || 0,
    viewsLabel: formatCompactNumber(post.views || 0),
    isFollowingAuthor: Boolean(post.profileId && followingSet.has(post.profileId)),
    isOwnAuthor: Boolean(viewerProfileId && post.profileId === viewerProfileId),
    viewerReaction: post.reactions?.[0]?.type || null,
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
  const [post, followingSet] = await Promise.all([
    prisma.post.findUnique({
      where: { id: Number(id) },
      include: buildPostInclude(viewerProfileId),
    }),
    getFollowingIdSet(viewerProfileId),
  ]);

  return enrichPost(post, viewerProfileId, followingSet);
}

export async function createPost(input) {
  const title = String(input.title || "").trim();
  const content = String(input.content || "").trim();

  if (!title || !content) {
    throw new Error("Title and content are required");
  }

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

  const tags = Array.isArray(input.tags)
    ? input.tags.map((tag) => String(tag).trim()).filter(Boolean).slice(0, 8)
    : [];
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
        language: String(input.language || "English"),
        premium: Boolean(input.premium),
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
  const current = await prisma.post.findUnique({
    where: { id: Number(postId) },
    select: { tags: true },
  });

  if (!current || !current.tags.length) return [];

  const [related, followingSet] = await Promise.all([
    prisma.post.findMany({
      where: {
        id: { not: Number(postId) },
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
  const comments = await prisma.comment.findMany({
    where: { postId: Number(postId) },
    orderBy: { createdAt: "desc" },
  });

  return comments.map((comment) => ({
    ...comment,
    time: formatRelativeTime(comment.createdAt),
  }));
}

export async function createComment(postId, input) {
  const content = String(input.content || "").trim();
  if (!content) throw new Error("Comment content is required");

  const post = await prisma.post.findUnique({ where: { id: Number(postId) } });
  if (!post) throw new Error("Post not found");

  const comment = await prisma.comment.create({
    data: {
      postId: post.id,
      profileId: String(input.profileId || "").trim() || undefined,
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

export async function getPostOwnerProfile(postId) {
  return prisma.post.findUnique({
    where: { id: Number(postId) },
    select: {
      id: true,
      title: true,
      profileId: true,
      authorName: true,
      authorHandle: true,
    },
  });
}

export async function deleteCommentById(commentId) {
  try {
    await prisma.comment.delete({ where: { id: Number(commentId) } });
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

  const post = await prisma.post.findUnique({
    where: { id: Number(postId) },
    select: { id: true, profileId: true, title: true },
  });

  if (!post) {
    throw new Error("Post not found");
  }

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
      post: enrichPost(updatedPost, profileId, new Set()),
      reaction: nextReaction,
    };
  });
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
      select: { tags: true, views: true },
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

export async function getDiscoverData(query = {}, viewerProfileId = null) {
  const [posts, dbProfiles, followingSet] = await Promise.all([
    getPosts(viewerProfileId),
    prisma.profile.findMany({
      where: viewerProfileId ? { id: { not: viewerProfileId } } : undefined,
      orderBy: { followers: "desc" },
      take: 4,
    }),
    getFollowingIdSet(viewerProfileId),
  ]);

  const categories = ["Recommended", ...new Set(posts.flatMap((post) => post.tags))];
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

  const tagQuery = normalizeHandle(query.tag || "");
  const search = String(query.q || "").trim().toLowerCase();

  const blogs = posts
    .map((post) => ({
      id: post.id,
      profileId: post.profileId,
      title: post.title,
      summary: post.summary,
      author: post.authorName,
      authorHandle: post.authorHandle,
      category: post.tags[0] || "Recommended",
      views: formatCompactNumber(post.views || 0),
      readTime: post.readTime,
      isFollowingAuthor: post.isFollowingAuthor,
      isOwnAuthor: post.isOwnAuthor,
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
