import { useQuery, useMutation } from "@tanstack/react-query";
import { analyticsApi, aiApi } from "../services/api";
import { queryKeys } from "../lib/queryClient";
import toast from "react-hot-toast";

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
    mutationFn: async (data: unknown) => {
      const response = await aiApi.analyze(data);
      return response.data.data;
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to analyze resume");
    },
  });
}

/**
 * Generate cover letter with AI
 */
export function useGenerateCoverLetter() {
  return useMutation({
    mutationFn: async (data: {
      resume: unknown;
      jobDescription: string;
      jobTitle?: string;
      company?: string;
    }) => {
      const response = await aiApi.generateCoverLetter(data);
      return response.data.data;
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to generate cover letter");
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
    onError: (error: Error) => {
      toast.error(error.message || "Failed to improve text");
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
    onError: (error: Error) => {
      toast.error(error.message || "Failed to generate bullets");
    },
  });
}

/**
 * Check ATS score with AI
 */
export function useATSCheck() {
  return useMutation({
    mutationFn: async (data: unknown) => {
      const response = await aiApi.checkATSScore(data);
      return response.data.data;
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to check ATS score");
    },
  });
}
