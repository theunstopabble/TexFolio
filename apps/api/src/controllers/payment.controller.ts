import { Request, Response } from "express";
import { paymentService } from "../services/payment.service.js";
import { User } from "../models/user.model.js";

class PaymentController {
  async createOrder(req: Request, res: Response) {
    try {
      const { amount } = req.body;
      if (!amount) {
        return res
          .status(400)
          .json({ success: false, error: "Amount is required" });
      }

      const order = await paymentService.createOrder(amount);
      res.status(200).json({ success: true, data: order });
    } catch (error: any) {
      console.error("Payment Order Error:", error);
      res.status(500).json({ success: false, error: "Failed to create order" });
    }
  }

  async verifyPayment(req: Request, res: Response) {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
        req.body;

      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res
          .status(400)
          .json({ success: false, error: "Missing verification details" });
      }

      const isValid = paymentService.verifyPayment(
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
      );

      if (isValid) {
        // Update User Role to PRO in DB
        // @ts-ignore - Validated by middleware
        const userId = req.userId;

        await User.findByIdAndUpdate(userId, {
          isPro: true,
          subscriptionId: razorpay_payment_id,
        });

        res
          .status(200)
          .json({ success: true, message: "Payment Verified & User Upgraded" });
      } else {
        res.status(400).json({ success: false, error: "Invalid Signature" });
      }
    } catch (error: any) {
      console.error("Payment Verification Error:", error);
      res
        .status(500)
        .json({ success: false, error: "Payment verification failed" });
    }
  }
}

export const paymentController = new PaymentController();
