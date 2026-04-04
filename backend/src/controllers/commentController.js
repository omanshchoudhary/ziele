import { deleteCommentById } from '../models/postModel.js';

export const deleteComment = (req, res) => {
  try {
    const deleted = deleteCommentById(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete comment' });
  }
};
