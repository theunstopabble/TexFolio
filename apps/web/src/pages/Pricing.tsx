import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authApi } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useRazorpay } from "../hooks/useRazorpay";
import toast from "react-hot-toast";

const Pricing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { handlePayment, loading } = useRazorpay();

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await authApi.getMe();
        if (res.data?.data?.isPro) {
          toast.success("You are already a Pro member!");
          navigate("/dashboard");
        }
      } catch {
        console.error("Failed to check status");
      }
    };
    if (user) checkStatus();
  }, [user, navigate]);

  const handleUpgrade = () => {
    if (!user) {
      toast.error("Please login to upgrade");
      return;
    }

    // Amount in INR (e.g. ₹499)
    const amount = 499;

    handlePayment(
      amount,
      {
        name: user.name || "User",
        email: user.email || "",
      },
      () => {
        // Success Callback
        toast.success("Welcome to Pro!");
        // Force refresh or redirect
        window.location.href = "/dashboard";
      },
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-20 text-center">
      <h1 className="text-4xl font-bold text-slate-900 mb-4">
        Simple Pricing, Powerful Resumes 🚀
      </h1>
      <p className="text-slate-600 mb-12 max-w-2xl mx-auto">
        Start for free, upgrade for professionals. Create resumes that stand out
        and get you hired faster.
      </p>

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {/* Free Plan */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-2xl font-bold text-slate-900 mb-2">Free</h3>
          <div className="text-4xl font-bold text-slate-900 mb-6">₹0</div>
          <ul className="space-y-4 text-left mb-8 text-slate-600">
            <li className="flex items-center gap-2">✅ Create 1 Resume</li>
            <li className="flex items-center gap-2">
              ✅ Basic LaTeX Templates
            </li>
            <li className="flex items-center gap-2">✅ PDF Export</li>
          </ul>
          <button className="w-full py-3 rounded-xl border-2 border-slate-200 font-bold text-slate-600 cursor-not-allowed">
            Current Plan
          </button>
        </div>

        {/* Pro Plan */}
        <div className="bg-slate-900 p-8 rounded-2xl shadow-xl text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-gradient-to-r from-orange-500 to-pink-500 text-white text-xs font-bold px-3 py-1 rounded-bl-xl">
            MOST POPULAR
          </div>
          <h3 className="text-2xl font-bold mb-2">Pro</h3>
          <div className="text-4xl font-bold mb-6">
            ₹499
            <span className="text-lg font-normal text-slate-400">
              /lifetime
            </span>
          </div>
          <ul className="space-y-4 text-left mb-8 text-slate-300">
            <li className="flex items-center gap-2">✨ Unlimited Resumes</li>
            <li className="flex items-center gap-2">
              📝 AI Cover Letter Generator
            </li>
            <li className="flex items-center gap-2">🧠 Advanced AI Analysis</li>
            <li className="flex items-center gap-2">🎨 Premium Templates</li>
          </ul>
          <button
            onClick={handleUpgrade}
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 font-bold text-white hover:shadow-lg transition-all"
          >
            {loading ? "Processing..." : "Upgrade Now 🚀"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
