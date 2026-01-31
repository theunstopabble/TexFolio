import { Router } from "express";
import { analyticsController } from "../controllers/analytics.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

// Protect all analytics routes
router.use(authMiddleware as any);

router.get("/", analyticsController.getStats);

export default router;
