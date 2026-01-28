import { Router } from 'express';
import resumeRoutes from './resume.routes.js';
import authRoutes from './auth.routes.js';

const router = Router();

// Mount routes
router.use('/resumes', resumeRoutes);
router.use('/auth', authRoutes);

// Future routes will be added here:
// router.use('/users', userRoutes);

export default router;