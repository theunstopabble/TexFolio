import Razorpay from "razorpay";
import crypto from "crypto";
import { env } from "../config/env.js";

class PaymentService {
  private razorpay: Razorpay;

  constructor() {
    const keyId = env.RAZORPAY_KEY_ID;
    const keySecret = env.RAZORPAY_KEY_SECRET;

    if (env.NODE_ENV === "production" && (!keyId || !keySecret)) {
      throw new Error("Razorpay keys are required in production");
    }

    this.razorpay = new Razorpay({
      key_id: keyId || "rzp_test_dummy",
      key_secret: keySecret || "dummy",
    });
  }

  async createOrder(amount: number, currency = "INR") {
    const options = {
      amount: amount * 100, // amount in smallest currency unit
      currency,
      receipt: `order_${Date.now()}`,
    };

    try {
      const order = await this.razorpay.orders.create(options);
      return order;
    } catch (error) {
      console.error("Razorpay Order Creation Failed:", error);
      throw new Error("Unable to create payment order");
    }
  }

  verifyPayment(orderId: string, paymentId: string, signature: string) {
    const text = orderId + "|" + paymentId;
    const generated_signature = crypto
      .createHmac("sha256", env.RAZORPAY_KEY_SECRET || "")
      .update(text)
      .digest("hex");

    // Use timingSafeEqual to prevent timing attacks
    try {
      if (
        crypto.timingSafeEqual(
          Buffer.from(generated_signature, "utf-8"),
          Buffer.from(signature, "utf-8"),
        )
      ) {
        return true;
      }
    } catch (e) {
      // If buffers are of different lengths or invalid
      return false;
    }

    return false;
  }
}

export const paymentService = new PaymentService();
