import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes.ts';
import submissionRoutes from '../modules/submission/submission.routes.ts';

const rootRouter = Router();

rootRouter.use('/auth', authRoutes);
rootRouter.use('/submissions', submissionRoutes);

export default rootRouter;
