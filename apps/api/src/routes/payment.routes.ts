import { Router } from "express";
import { paymentController } from "../controllers/payment.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/order", authMiddleware as any, paymentController.createOrder);
router.post("/verify", authMiddleware as any, paymentController.verifyPayment);

export default router;
