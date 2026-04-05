import {
  createComment,
  createPost,
  deletePostById,
  getBookmarkedPosts,
  getCommentsByPostId,
  getPostById as getPostByIdModel,
  getPostOwnerProfile,
  getPosts,
  getRandomPost,
  getRelatedPosts,
  toggleBookmark,
  toggleReaction,
  updatePostById,
} from "../models/postModel.js";
import { getProfileForClerkUser } from "../models/clerkSyncModel.js";
import { cloudinary } from "../integrations/cloudinaryClient.js";
import { getServiceReadinessSnapshot } from "../config/env.js";
import { notifyProfile } from "../services/notificationService.js";
import {
  assertUploadMimeType,
  validateExternalMediaUrl,
} from "../utils/mediaUtils.js";

function statusFromError(error, fallback = 400) {
  return Number(error?.statusCode || fallback);
}

async function resolveAuthProfile(req) {
  const clerkUserId = req?.authContext?.userId || null;
  if (!clerkUserId) return null;
  const profile = await getProfileForClerkUser(clerkUserId);
  req.resolvedProfile = profile || null;
  return profile;
}

function applyAuthenticatedAuthor(input = {}, profile = null) {
  if (!profile) return input;

  return {
    ...input,
    profileId: profile.id,
    authorName: profile.name,
    authorHandle: profile.handle,
    avatar: profile.avatar,
  };
}

export const getAllPosts = async (req, res) => {
  try {
    const authProfile = await resolveAuthProfile(req);
    const posts = await getPosts(authProfile?.id || null);
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch posts" });
  }
};

export const getPostById = async (req, res) => {
  try {
    const { id } = req.params;
    const authProfile = await resolveAuthProfile(req);
    const post = await getPostByIdModel(id, authProfile?.id || null);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }
    res.json(post);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch post" });
  }
};

export const createPostItem = async (req, res) => {
  try {
    const authProfile = await resolveAuthProfile(req);
    const payload = applyAuthenticatedAuthor(
      req.validatedBody || req.body || {},
      authProfile,
    );

    const post = await createPost(payload);
    res.status(201).json(post);
  } catch (error) {
    res
      .status(statusFromError(error))
      .json({ error: error.message || "Failed to create post" });
  }
};

export const updatePostItem = async (req, res) => {
  try {
    const authProfile = await resolveAuthProfile(req);
    if (!authProfile?.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const post = await updatePostById(
      req.params.id,
      req.validatedBody || req.body || {},
      authProfile.id,
    );

    return res.json(post);
  } catch (error) {
    return res.status(statusFromError(error)).json({
      error: error.message || "Failed to update post.",
    });
  }
};

export const deletePostItem = async (req, res) => {
  try {
    const authProfile = await resolveAuthProfile(req);
    if (!authProfile?.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    await deletePostById(req.params.id, authProfile.id);
    return res.status(204).send();
  } catch (error) {
    return res.status(statusFromError(error)).json({
      error: error.message || "Failed to delete post.",
    });
  }
};

export const getRandomPostItem = async (req, res) => {
  try {
    const authProfile = await resolveAuthProfile(req);
    const post = await getRandomPost(authProfile?.id || null);
    if (!post) {
      return res.status(404).json({ error: "No posts available" });
    }
    res.json(post);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch random post" });
  }
};

export const getPostComments = async (req, res) => {
  try {
    const comments = await getCommentsByPostId(req.params.id);
    res.json(comments);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch comments" });
  }
};

export const createPostComment = async (req, res) => {
  try {
    const authProfile = await resolveAuthProfile(req);
    const payload = applyAuthenticatedAuthor(
      req.validatedBody || req.body || {},
      authProfile,
    );

    const comment = await createComment(req.params.id, payload);

    const owner = await getPostOwnerProfile(req.params.id);
    if (owner?.profileId && authProfile) {
      await notifyProfile({
        targetUser: owner.profileId,
        type: "comment",
        sourceProfile: authProfile,
        postTitle: owner.title,
        content: comment.content,
        metadata: {
          postId: owner.id,
          commentId: comment.id,
        },
      });
    }

    res.status(201).json(comment);
  } catch (error) {
    const status = statusFromError(
      error,
      error.message === "Post not found" ? 404 : 400,
    );
    res
      .status(status)
      .json({ error: error.message || "Failed to create comment" });
  }
};

export const getRelatedPostItems = async (req, res) => {
  try {
    const authProfile = await resolveAuthProfile(req);
    const relatedPosts = await getRelatedPosts(
      req.params.id,
      authProfile?.id || null,
    );
    res.json(relatedPosts);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch related posts" });
  }
};

export const reactToPostItem = async (req, res) => {
  try {
    const authProfile = await resolveAuthProfile(req);
    if (!authProfile?.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { post, reaction } = await toggleReaction(
      req.params.id,
      authProfile.id,
      (req.validatedBody || req.body || {}).type,
    );

    if (reaction) {
      await notifyProfile({
        targetUser: post.profileId,
        type: reaction,
        sourceProfile: authProfile,
        postTitle: post.title,
        metadata: {
          postId: post.id,
          reaction,
        },
      });
    }

    return res.json({
      reaction,
      post,
    });
  } catch (error) {
    const status = statusFromError(
      error,
      error.message === "Post not found" ? 404 : 400,
    );
    return res.status(status).json({
      error: error.message || "Failed to react to post.",
    });
  }
};

export const togglePostBookmarkItem = async (req, res) => {
  try {
    const authProfile = await resolveAuthProfile(req);
    if (!authProfile?.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const result = await toggleBookmark(req.params.id, authProfile.id);
    return res.json(result);
  } catch (error) {
    return res.status(statusFromError(error)).json({
      error: error.message || "Failed to update bookmark.",
    });
  }
};

export const getMyBookmarks = async (req, res) => {
  try {
    const authProfile = await resolveAuthProfile(req);
    if (!authProfile?.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const bookmarks = await getBookmarkedPosts(authProfile.id);
    return res.json(bookmarks);
  } catch (error) {
    return res.status(500).json({
      error: error.message || "Failed to fetch bookmarks.",
    });
  }
};

export const validatePostMediaUrlItem = async (req, res) => {
  try {
    const { mediaUrl, mediaType } = req.validatedBody || req.body || {};
    const validated = validateExternalMediaUrl(mediaUrl, mediaType);

    return res.json({
      url: validated.url,
      mediaType: validated.mediaType,
      mediaSource: "url",
    });
  } catch (error) {
    return res
      .status(400)
      .json({ error: error.message || "Invalid media URL provided." });
  }
};

export const uploadPostMediaItem = async (req, res) => {
  try {
    if (!getServiceReadinessSnapshot().cloudinary.configured) {
      return res.status(503).json({
        error: "Cloudinary is not configured yet.",
      });
    }

    if (!req.file?.buffer) {
      return res.status(400).json({ error: "Please attach an image or video file." });
    }

    const mediaType = assertUploadMimeType(req.file.mimetype);

    const uploaded = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "ziele/posts",
          resource_type: mediaType,
        },
        (uploadError, result) => {
          if (uploadError) {
            reject(uploadError);
            return;
          }

          resolve(result);
        },
      );

      // Cloudinary accepts streams, so we avoid writing temp files to disk.
      stream.end(req.file.buffer);
    });

    return res.status(201).json({
      url: uploaded.secure_url,
      mediaType: uploaded.resource_type === "video" ? "video" : "image",
      mediaSource: "upload",
      publicId: uploaded.public_id,
    });
  } catch (error) {
    return res.status(400).json({
      error: error.message || "Failed to upload media.",
    });
  }
};
