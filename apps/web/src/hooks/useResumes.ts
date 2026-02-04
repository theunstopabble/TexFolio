import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { resumeApi } from "../services/api";
import { queryKeys } from "../lib/queryClient";
import toast from "react-hot-toast";

// ============================================
// Resume Queries
// ============================================

/**
 * Fetch all resumes for the current user
 */
export function useResumes() {
  return useQuery({
    queryKey: queryKeys.resumes.all,
    queryFn: async () => {
      const response = await resumeApi.getAll();
      return response.data.data;
    },
  });
}

/**
 * Fetch a single resume by ID
 */
export function useResume(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.resumes.detail(id!),
    queryFn: async () => {
      if (!id) throw new Error("Resume ID is required");
      const response = await resumeApi.getById(id);
      return response.data.data;
    },
    enabled: !!id, // Only fetch when ID exists
  });
}

// ============================================
// Resume Mutations
// ============================================

/**
 * Create a new resume
 */
export function useCreateResume() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: unknown) => {
      const response = await resumeApi.create(data);
      return response.data.data;
    },
    onSuccess: () => {
      // Invalidate resumes list to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.resumes.all });
      toast.success("Resume created successfully! 🎉");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create resume");
    },
  });
}

/**
 * Update an existing resume
 */
export function useUpdateResume() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: unknown }) => {
      const response = await resumeApi.update(id, data);
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      // Invalidate both the list and the specific resume
      queryClient.invalidateQueries({ queryKey: queryKeys.resumes.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.resumes.detail(variables.id),
      });
      toast.success("Resume updated successfully! 🎉");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update resume");
    },
  });
}

/**
 * Delete a resume
 */
export function useDeleteResume() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await resumeApi.delete(id);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.resumes.all });
      toast.success("Resume deleted");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete resume");
    },
  });
}

/**
 * Toggle resume visibility (public/private)
 */
export function useToggleVisibility() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await resumeApi.toggleVisibility(id);
      return response.data.data;
    },
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.resumes.detail(id) });
      toast.success(
        data.isPublic ? "Resume is now public" : "Resume is now private",
      );
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update visibility");
    },
  });
}

/**
 * Generate PDF for a resume
 */
export function useGeneratePdf() {
  return useMutation({
    mutationFn: async (id: string) => {
      const url = await resumeApi.generatePdf(id);
      return url;
    },
    onSuccess: (url) => {
      window.open(url, "_blank");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to generate PDF");
    },
  });
}
