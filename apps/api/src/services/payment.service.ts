import Razorpay from "razorpay";
import crypto from "crypto";
import { env } from "../config/env.js";

class PaymentService {
  private razorpay: Razorpay;

  constructor() {
    this.razorpay = new Razorpay({
      key_id: env.RAZORPAY_KEY_ID || "rzp_test_dummy",
      key_secret: env.RAZORPAY_KEY_SECRET || "dummy",
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

    if (generated_signature === signature) {
      return true;
    } else {
      return false;
    }
  }
}

export const paymentService = new PaymentService();
