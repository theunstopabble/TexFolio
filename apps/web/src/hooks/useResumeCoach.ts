import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

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

/**
 * Run full Resume Coach Agent analysis
 */
async function runCoachAnalysis(
  resumeData: Record<string, unknown>,
  jobDescription: string | undefined,
  getToken: () => Promise<string | null>,
): Promise<CoachAnalysisResult> {
  const token = await getToken();
  if (!token) {
    throw new Error("Authentication required. Please sign in.");
  }

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
  resumeData: Record<string, unknown>,
  jobDescription: string | undefined,
  getToken: () => Promise<string | null>,
): Promise<QuickScoreResult> {
  const token = await getToken();
  if (!token) {
    throw new Error("Authentication required. Please sign in.");
  }

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
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async ({
      resumeData,
      jobDescription,
    }: {
      resumeData: Record<string, unknown>;
      jobDescription?: string;
    }) => {
      return runCoachAnalysis(resumeData, jobDescription, getToken);
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
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async ({
      resumeData,
      jobDescription,
    }: {
      resumeData: Record<string, unknown>;
      jobDescription?: string;
    }) => {
      return getQuickScore(resumeData, jobDescription, getToken);
    },
    onSuccess: (data) => {
      toast.success(`ATS Score: ${data.atsScore}/100`);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Quick score failed");
    },
  });
}
