import express from 'express';
import {
  checkHealth,
  checkReadiness,
} from '../controllers/healthController.js';

const router = express.Router();

router.get('/', checkHealth);
router.get('/readiness', checkReadiness);

export default router;
