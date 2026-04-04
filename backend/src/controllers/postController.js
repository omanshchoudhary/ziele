import { getPosts, getPostById as getPostByIdModel } from '../models/postModel.js';

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
