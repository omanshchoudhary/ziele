import {
  createComment,
  createPost,
  getCommentsByPostId,
  getPostById as getPostByIdModel,
  getPosts,
  getRandomPost,
  getRelatedPosts,
} from "../models/postModel.js";
import { getProfileForClerkUser } from "../models/clerkSyncModel.js";

async function resolveAuthProfile(req) {
  const clerkUserId = req?.authContext?.userId || null;
  if (!clerkUserId) return null;
  return await getProfileForClerkUser(clerkUserId);
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
    const posts = await getPosts();
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch posts" });
  }
};

export const getPostById = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await getPostByIdModel(id);
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
    const payload = applyAuthenticatedAuthor(req.body || {}, authProfile);

    const post = await createPost(payload);
    res.status(201).json(post);
  } catch (error) {
    res.status(400).json({ error: error.message || "Failed to create post" });
  }
};

export const getRandomPostItem = async (req, res) => {
  try {
    const post = await getRandomPost();
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
    const payload = applyAuthenticatedAuthor(req.body || {}, authProfile);

    const comment = await createComment(req.params.id, payload);
    res.status(201).json(comment);
  } catch (error) {
    const status = error.message === "Post not found" ? 404 : 400;
    res
      .status(status)
      .json({ error: error.message || "Failed to create comment" });
  }
};

export const getRelatedPostItems = async (req, res) => {
  try {
    const relatedPosts = await getRelatedPosts(req.params.id);
    res.json(relatedPosts);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch related posts" });
  }
};
