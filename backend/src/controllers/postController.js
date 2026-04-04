import {
  createComment,
  createPost,
  getCommentsByPostId,
  getPostById as getPostByIdModel,
  getPosts,
  getRandomPost,
  getRelatedPosts,
} from '../models/postModel.js';

export const getAllPosts = (req, res) => {
  try {
    const posts = getPosts();
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
};

export const getPostById = (req, res) => {
  try {
    const { id } = req.params;
    const post = getPostByIdModel(id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    res.json(post);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch post' });
  }
};

export const createPostItem = (req, res) => {
  try {
    const post = createPost(req.body || {});
    res.status(201).json(post);
  } catch (error) {
    res.status(400).json({ error: error.message || 'Failed to create post' });
  }
};

export const getRandomPostItem = (req, res) => {
  try {
    const post = getRandomPost();
    if (!post) {
      return res.status(404).json({ error: 'No posts available' });
    }
    res.json(post);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch random post' });
  }
};

export const getPostComments = (req, res) => {
  try {
    const comments = getCommentsByPostId(req.params.id);
    res.json(comments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
};

export const createPostComment = (req, res) => {
  try {
    const comment = createComment(req.params.id, req.body || {});
    res.status(201).json(comment);
  } catch (error) {
    const status = error.message === 'Post not found' ? 404 : 400;
    res.status(status).json({ error: error.message || 'Failed to create comment' });
  }
};

export const getRelatedPostItems = (req, res) => {
  try {
    const relatedPosts = getRelatedPosts(req.params.id);
    res.json(relatedPosts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch related posts' });
  }
};
