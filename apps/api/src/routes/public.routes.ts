import { Router } from "express";
import { resumeController } from "../controllers/resume.controller.js";

const router = Router();

// Public route for viewing shared resumes
router.get("/:shareId", resumeController.getPublicResume);

export default router;
