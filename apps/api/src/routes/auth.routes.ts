import { Router } from "express";
import { register, login, getMe } from "../controllers/auth.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

// POST /api/auth/register
router.post("/register", register);

// POST /api/auth/login
router.post("/login", login);

// GET /api/auth/me (protected)
router.get("/me", authMiddleware as any, getMe);

export default router;
