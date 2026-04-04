import express from 'express';
import {
  getAllProfiles,
  getCurrentProfile,
  getProfile,
} from '../controllers/profileController.js';

const router = express.Router();

router.get('/', getAllProfiles);
router.get('/current', getCurrentProfile);
router.get('/:id', getProfile);

export default router;
