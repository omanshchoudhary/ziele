import express from 'express';
import {
  createPostComment,
  createPostItem,
  getAllPosts,
  getPostById,
  getPostComments,
  getRandomPostItem,
  getRelatedPostItems,
} from '../controllers/postController.js';

const router = express.Router();

router.get('/random', getRandomPostItem);
router.get('/', getAllPosts);
router.post('/', createPostItem);
router.get('/:id/comments', getPostComments);
router.post('/:id/comments', createPostComment);
router.get('/:id/related', getRelatedPostItems);
router.get('/:id', getPostById);

export default router;
