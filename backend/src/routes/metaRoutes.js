import express from 'express';
import { getDiscover, getSidebar } from '../controllers/metaController.js';
import { optionalAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get('/sidebar', optionalAuth, getSidebar);
router.get('/discover', optionalAuth, getDiscover);

export default router;
