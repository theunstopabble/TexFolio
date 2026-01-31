import { useState } from "react";
import { paymentApi } from "../services/api";
import toast from "react-hot-toast";

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayInstance {
  open: () => void;
}

// Add Razorpay types global declaration
interface RazorpayOptions {
  key: string;
  amount: string;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayResponse) => void;
  prefill: {
    name: string;
    email: string;
    contact: string;
  };
  theme: {
    color: string;
  };
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

export const useRazorpay = () => {
  const [loading, setLoading] = useState(false);

  const loadScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async (
    amount: number,
    userDetails: { name: string; email: string },
    onSuccess: () => void,
  ) => {
    const res = await loadScript();

    if (!res) {
      toast.error("Razorpay SDK failed to load. Are you online?");
      return;
    }

    setLoading(true);

    try {
      // 1. Create Order
      const orderResponse = await paymentApi.createOrder(amount);
      const {
        id: order_id,
        amount: order_amount,
        currency,
      } = orderResponse.data.data;

      // 2. Options for Razorpay
      const options: RazorpayOptions = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || "", // Add this to env
        amount: order_amount.toString(),
        currency: currency,
        name: "TexFolio",
        description: "Upgrade to Pro Features",
        order_id: order_id,
        handler: async function (response: RazorpayResponse) {
          const data = {
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature,
          };

          const result = await paymentApi.verifyPayment(data);

          if (result.data.success) {
            toast.success("Payment Successful! Welcome to Pro 🚀");
            onSuccess();
          } else {
            toast.error("Payment Verification Failed");
          }
        },
        prefill: {
          name: userDetails.name,
          email: userDetails.email,
          contact: "",
        },
        theme: {
          color: "#4F46E5",
        },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    } catch (error) {
      console.error("Payment Error:", error);
      toast.error("Something went wrong with payment");
    } finally {
      setLoading(false);
    }
  };

  return { handlePayment, loading };
};
