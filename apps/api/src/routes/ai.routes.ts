import { Router } from "express";
import { aiController } from "../controllers/ai.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

// Protect AI route so only logged-in users can use it
router.post("/analyze", authMiddleware as any, aiController.analyze);

export default router;
