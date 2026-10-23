import { Router } from 'express';
import { submissionController } from './submission.controller.ts';
import { authenticate, requireRole } from '../../middlewares/auth.ts';
import { submissionRateLimiter } from '../../middlewares/rateLimiter.ts';

const router = Router();

// Student endpoints
router.post(
  '/',
  authenticate,
  requireRole('STUDENT'),
  submissionRateLimiter,
  submissionController.create
);

router.get(
  '/my',
  authenticate,
  requireRole('STUDENT'),
  submissionController.getMy
);

// Mentor endpoints
router.get(
  '/',
  authenticate,
  requireRole('MENTOR', 'ADMIN'),
  submissionController.getAll
);

router.get(
  '/stats',
  authenticate,
  requireRole('MENTOR', 'ADMIN'),
  submissionController.getStats
);

router.patch(
  '/:id/status',
  authenticate,
  requireRole('MENTOR', 'ADMIN'),
  submissionController.updateStatus
);

export default router;
