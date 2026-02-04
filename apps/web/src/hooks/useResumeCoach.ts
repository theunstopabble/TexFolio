import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import toast from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

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

const getAuthToken = async () => {
  // Get token from Clerk
  const { Clerk } = window as any;
  if (Clerk?.session) {
    return await Clerk.session.getToken();
  }
  return null;
};

/**
 * Run full Resume Coach Agent analysis
 */
async function runCoachAnalysis(
  resumeData: Record<string, any>,
  jobDescription?: string,
): Promise<CoachAnalysisResult> {
  const token = await getAuthToken();

  const response = await axios.post(
    `${API_URL}/agents/coach`,
    { resumeData, jobDescription },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  return response.data.data;
}

/**
 * Get quick ATS score
 */
async function getQuickScore(
  resumeData: Record<string, any>,
  jobDescription?: string,
): Promise<QuickScoreResult> {
  const token = await getAuthToken();

  const response = await axios.post(
    `${API_URL}/agents/quick-score`,
    { resumeData, jobDescription },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  return response.data.data;
}

// ============================================
// Hooks
// ============================================

/**
 * Hook for running the Resume Coach Agent
 * Provides comprehensive resume analysis with breakdown by category
 */
export function useResumeCoach() {
  return useMutation({
    mutationFn: async ({
      resumeData,
      jobDescription,
    }: {
      resumeData: Record<string, any>;
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

/**
 * Hook for getting quick ATS score
 * Faster analysis with just score and top recommendations
 */
export function useQuickScore() {
  return useMutation({
    mutationFn: async ({
      resumeData,
      jobDescription,
    }: {
      resumeData: Record<string, any>;
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
