import express from 'express';
import { getDiscover, getSidebar } from '../controllers/metaController.js';

const router = express.Router();

router.get('/sidebar', getSidebar);
router.get('/discover', getDiscover);

export default router;
