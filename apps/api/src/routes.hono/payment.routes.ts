import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { authMiddleware } from "../middleware.hono/auth.middleware.js";
import { paymentService } from "../services/payment.service.js";

// Create payment router
export const paymentRoutes = new Hono();

// Validation schemas
const createOrderSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
});

const verifyPaymentSchema = z.object({
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
});

// Apply auth middleware
paymentRoutes.use("/*", authMiddleware);

// Create order
paymentRoutes.post(
  "/create-order",
  zValidator("json", createOrderSchema),
  async (c) => {
    try {
      const user = c.get("user");
      const { amount } = c.req.valid("json");

      if (!user.mongoUserId) {
        return c.json({ success: false, error: "User not found" }, 400);
      }

      const order = await paymentService.createOrder(amount);

      return c.json({
        success: true,
        data: order,
      });
    } catch (error: any) {
      console.error("Create Order Error:", error);
      return c.json({ success: false, error: error.message }, 500);
    }
  },
);

// Verify payment
paymentRoutes.post(
  "/verify",
  zValidator("json", verifyPaymentSchema),
  async (c) => {
    try {
      const user = c.get("user");
      const payload = c.req.valid("json");

      if (!user.mongoUserId) {
        return c.json({ success: false, error: "User not found" }, 400);
      }

      const isValid = paymentService.verifyPayment(
        payload.razorpay_order_id,
        payload.razorpay_payment_id,
        payload.razorpay_signature,
      );

      if (isValid) {
        // Grant Pro Access
        const { User } = await import("../models/user.model.js");
        await User.findOneAndUpdate(
          { _id: user.mongoUserId },
          { isPro: true, subscriptionId: payload.razorpay_payment_id },
        );

        return c.json({
          success: true,
          message: "Payment verified successfully. Pro access granted!",
        });
      } else {
        return c.json(
          { success: false, error: "Invalid payment signature" },
          400,
        );
      }
    } catch (error: any) {
      console.error("Verify Payment Error:", error);
      return c.json({ success: false, error: error.message }, 500);
    }
  },
);
