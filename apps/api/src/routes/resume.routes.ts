import { Router } from "express";
import { resumeController } from "../controllers/resume.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validation.middleware.js";
import { resumeSchema, updateResumeSchema } from "../schemas/resume.schema.js";

const router = Router();

// Public route (Must be before auth middleware)
router.get("/public/:shareId", resumeController.getPublicResume);

// Protect all routes
router.use(authMiddleware as any);

// Routes
router.get("/", resumeController.getAll);
router.get("/:id", resumeController.getById);
router.post("/", validate(resumeSchema), resumeController.create);
router.put("/:id", validate(updateResumeSchema), resumeController.update);
router.delete("/:id", resumeController.delete);
router.get("/:id/pdf", resumeController.generatePdf);
router.patch("/:id/visibility", resumeController.toggleVisibility);

export default router;
