import { Router } from 'express';
import { syncController } from '../controllers/index.js';
import { validate } from '../middlewares/index.js';
import { syncSchema } from '../utils/validation.js';

const router = Router();

/**
 * @route   POST /api/sync
 * @desc    Trigger manual synchronization with carrier API
 * @access  Public
 */
router.post(
  '/',
  validate(syncSchema),
  syncController.triggerSync.bind(syncController)
);

export default router;
