import { Router } from "express";
import resumeRoutes from "./resume.routes.js";
import aiRoutes from "./ai.routes.js";
import analyticsRoutes from "./analytics.routes.js";

const router = Router();

// Mount routes
router.use("/resumes", resumeRoutes);
router.use("/ai", aiRoutes);
router.use("/analytics", analyticsRoutes);
// router.use('/auth', authRoutes);

// Future routes will be added here:
// router.use('/users', userRoutes);

export default router;
