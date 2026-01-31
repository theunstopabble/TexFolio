import { Router } from "express";
import { aiController } from "../controllers/ai.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

// Protect AI route so only logged-in users can use it
router.post("/analyze", authMiddleware as any, aiController.analyze);
router.post(
  "/cover-letter",
  authMiddleware as any,
  aiController.generateCoverLetter,
);
router.post("/improve", authMiddleware as any, aiController.improveText);
router.post(
  "/generate-bullets",
  authMiddleware as any,
  aiController.generateBullets,
);

router.post("/ats-check", authMiddleware as any, aiController.checkATSScore);

export default router;
