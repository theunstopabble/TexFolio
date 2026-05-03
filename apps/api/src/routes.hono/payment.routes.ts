import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { authMiddleware } from "../middleware.hono/auth.middleware.js";
import { paymentService } from "../services/payment.service.js";
import crypto from "crypto";
import { env } from "../config/env.js";

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

// Apply auth middleware to protected payment routes (NOT webhook)
paymentRoutes.use("/create-order", authMiddleware);
paymentRoutes.use("/verify", authMiddleware);

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
        // Grant Pro Access (idempotent — check if already verified)
        const { User } = await import("../models/user.model.js");
        const existingUser = await User.findById(user.mongoUserId);

        if (existingUser?.subscriptionId === payload.razorpay_payment_id) {
          // Already verified this payment — return success without re-processing
          return c.json({
            success: true,
            message: "Payment was already verified. Pro access is active.",
          });
        }

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

// ============================================
// Webhook Route (No auth required — Razorpay sends webhook)
// ============================================

/**
 * POST /api/payments/webhook
 * Razorpay webhook handler for server-side payment confirmation.
 * This is the authoritative source of truth for payment status.
 */
paymentRoutes.post("/webhook", async (c) => {
  try {
    // Verify webhook signature from Razorpay
    const webhookSecret = env.RAZORPAY_WEBHOOK_SECRET;
    const signature = c.req.header("x-razorpay-signature");

    if (!webhookSecret || !signature) {
      console.error("Webhook: Missing signature or secret");
      return c.json({ success: false, error: "Invalid webhook" }, 401);
    }

    const body = await c.req.text();

    // Verify HMAC-SHA256 signature
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(body)
      .digest("hex");

    if (
      !crypto.timingSafeEqual(
        Buffer.from(expectedSignature, "utf-8"),
        Buffer.from(signature, "utf-8"),
      )
    ) {
      console.error("Webhook: Invalid signature");
      return c.json({ success: false, error: "Invalid signature" }, 401);
    }

    let event;
    try {
      event = JSON.parse(body);
    } catch {
      console.error("Webhook: Invalid JSON body");
      return c.json({ success: false, error: "Invalid JSON body" }, 400);
    }
    const { event: eventType, payload } = event;

    console.log(`🔔 Razorpay Webhook: ${eventType}`);

    if (eventType === "payment.captured") {
      const payment = payload.payment?.entity;
      if (!payment) {
        return c.json({ success: false, error: "Invalid payload" }, 400);
      }

      const { User } = await import("../models/user.model.js");
      const razorpayPaymentId = payment.id;

      // Idempotent: check if already processed
      const existingUser = await User.findOne({
        subscriptionId: razorpayPaymentId,
      });

      if (existingUser) {
        console.log(
          `Webhook: Payment ${razorpayPaymentId} already processed`,
        );
        return c.json({ success: true, message: "Already processed" });
      }

      // Find user by email from payment metadata
      const userEmail = payment.email;
      if (userEmail) {
        await User.findOneAndUpdate(
          { email: userEmail.toLowerCase() },
          { isPro: true, subscriptionId: razorpayPaymentId },
        );
        console.log(
          `✅ Webhook: Pro access granted to ${userEmail} (payment: ${razorpayPaymentId})`,
        );
      }
    }

    return c.json({ success: true, message: "Webhook processed" });
  } catch (error: any) {
    console.error("Webhook Error:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});
