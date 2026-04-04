import express from 'express';
import { deleteComment } from '../controllers/commentController.js';

const router = express.Router();

router.delete('/:id', deleteComment);

export default router;
