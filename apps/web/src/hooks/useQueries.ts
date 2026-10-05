import { useQuery, useMutation } from "@tanstack/react-query";
import { analyticsApi, aiApi } from "../services/api";
import { queryKeys } from "../lib/queryClient";
import toast from "react-hot-toast";
import type { ResumeFormData } from "../features/resume-editor/types";
import { normalizeResumeForAI } from "../features/resume-editor/lib/normalizeForAI";

// ============================================
// Analytics Queries
// ============================================

/**
 * Fetch analytics/stats for the current user
 */
export function useAnalytics() {
  return useQuery({
    queryKey: queryKeys.analytics,
    queryFn: async () => {
      const response = await analyticsApi.getStats();
      return response.data.data;
    },
  });
}

// ============================================
// AI Mutations
// ============================================

/**
 * Analyze resume with AI
 */
export function useAnalyzeResume() {
  return useMutation({
    mutationFn: async (resumeData: ResumeFormData) => {
      const normalized = normalizeResumeForAI(resumeData);
      const response = await aiApi.analyze(normalized);
      return response.data.data;
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Failed to analyze resume";
      toast.error(message);
    },
  });
}

/**
 * Generate cover letter with AI
 */
export function useGenerateCoverLetter() {
  return useMutation({
    mutationFn: async (data: {
      resume: ResumeFormData;
      jobDescription: string;
      jobTitle?: string;
      company?: string;
    }) => {
      const response = await aiApi.generateCoverLetter(data);
      return response.data.data;
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Failed to generate cover letter";
      toast.error(message);
    },
  });
}

/**
 * Improve text with AI
 */
export function useImproveText() {
  return useMutation({
    mutationFn: async (text: string) => {
      const response = await aiApi.improveText(text);
      return response.data.data;
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Failed to improve text";
      toast.error(message);
    },
  });
}

/**
 * Generate bullet points with AI
 */
export function useGenerateBullets() {
  return useMutation({
    mutationFn: async (jobTitle: string) => {
      const response = await aiApi.generateBullets(jobTitle);
      return response.data.data;
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Failed to generate bullets";
      toast.error(message);
    },
  });
}

/**
 * Check ATS score with AI
 */
export function useATSCheck() {
  return useMutation({
    mutationFn: async (data: { resumeData: ResumeFormData; jobDescription?: string }) => {
      const response = await aiApi.checkATSScore(data.resumeData, data.jobDescription);
      return response.data.data;
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Failed to check ATS score";
      toast.error(message);
    },
  });
}
