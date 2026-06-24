import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import api from "../services/api";

// ============================================
// Types
// ============================================

export interface CoachAnalysisResult {
  finalScore: number;
  breakdown: {
    content?: {
      score: number;
      feedback: string[];
    };
    ats?: {
      score: number;
      keywords: string[];
      missing: string[];
    };
    format?: {
      score: number;
      issues: string[];
    };
    impact?: {
      score: number;
      suggestions: string[];
    };
  };
  recommendations: string[];
}

export interface QuickScoreResult {
  score: number;
  atsScore: number;
  topRecommendations: string[];
}

// ============================================
// API Functions
// ============================================

/**
 * Run full Resume Coach Agent analysis
 */
async function runCoachAnalysis(
  resumeData: Record<string, unknown>,
  jobDescription: string | undefined,
): Promise<CoachAnalysisResult> {
  const response = await api.post("/agents/coach", { resumeData, jobDescription });
  return response.data.data;
}

/**
 * Get quick ATS score
 */
async function getQuickScore(
  resumeData: Record<string, unknown>,
  jobDescription: string | undefined,
): Promise<QuickScoreResult> {
  const response = await api.post("/agents/quick-score", { resumeData, jobDescription });
  return response.data.data;
}

// ============================================
// Hooks
// ============================================

export function useResumeCoach() {
  return useMutation({
    mutationFn: async ({
      resumeData,
      jobDescription,
    }: {
      resumeData: Record<string, unknown>;
      jobDescription?: string;
    }) => {
      return runCoachAnalysis(resumeData, jobDescription);
    },
    onSuccess: (data) => {
      toast.success(`Analysis complete! Score: ${data.finalScore}/100`);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Analysis failed");
    },
  });
}

export function useQuickScore() {
  return useMutation({
    mutationFn: async ({
      resumeData,
      jobDescription,
    }: {
      resumeData: Record<string, unknown>;
      jobDescription?: string;
    }) => {
      return getQuickScore(resumeData, jobDescription);
    },
    onSuccess: (data) => {
      toast.success(`ATS Score: ${data.atsScore}/100`);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Quick score failed");
    },
  });
}
