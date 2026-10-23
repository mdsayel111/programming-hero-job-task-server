import { Router } from 'express';
import { authController } from './auth.controller.ts';
import { authenticate } from '../../middlewares/auth.ts';
import { authRateLimiter } from '../../middlewares/rateLimiter.ts';

const router = Router();

router.post('/register', authRateLimiter, authController.register);
router.post('/login', authRateLimiter, authController.login);
router.get('/me', authenticate, authController.getMe);

export default router;
