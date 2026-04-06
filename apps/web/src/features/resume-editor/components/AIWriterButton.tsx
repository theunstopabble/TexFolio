import { useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import toast from "react-hot-toast";

export const AIWriterButton = ({
  onResult,
  originalText,
  jobTitle,
  type = "improve",
}: {
  onResult: (text: string) => void;
  originalText?: string;
  jobTitle?: string;
  type?: "improve" | "generate";
}) => {
  const [loading, setLoading] = useState(false);
  const { isPro } = useAuth();

  const handleAI = async () => {
    if (!isPro) {
      toast.error("AI Writer is a Pro feature! Please upgrade to Pro.");
      return;
    }
    setLoading(true);
    try {
      const { aiApi } = await import("../../../services/api"); // Lazy load

      let resultText = "";
      if (type === "improve" && originalText) {
        const res = await aiApi.improveText(originalText);
        if (res.data.success) resultText = res.data.data.improvedText;
      } else if (type === "generate" && jobTitle) {
        const res = await aiApi.generateBullets(jobTitle);
        if (res.data.success) resultText = res.data.data.bullets[0]; // Take first bullet for now
      }

      if (resultText) onResult(resultText);
      else toast.error("AI could not generate a suggestion. Please try again.");
    } catch (err) {
      console.error("AI Error:", err);
      toast.error("AI service failed. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleAI}
      disabled={loading}
      className="text-xs flex items-center gap-1 text-purple-600 hover:text-purple-700 font-semibold mb-1"
    >
      {loading ? (
        <span className="animate-pulse">✨ Thinking...</span>
      ) : (
        <>
          <span>
            ✨ {type === "improve" ? "Improve with AI" : "Generate Point"}
          </span>
        </>
      )}
    </button>
  );
};
