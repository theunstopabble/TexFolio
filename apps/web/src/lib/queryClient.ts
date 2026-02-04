import { QueryClient } from "@tanstack/react-query";

// Create a centralized QueryClient with default options
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is considered fresh for 5 minutes
      staleTime: 5 * 60 * 1000,
      // Cache data for 30 minutes
      gcTime: 30 * 60 * 1000,
      // Retry failed requests up to 3 times
      retry: 3,
      // Don't refetch on window focus (better for form editing)
      refetchOnWindowFocus: false,
    },
    mutations: {
      // Retry mutations once on failure
      retry: 1,
    },
  },
});

// Query Keys - centralized for consistency
export const queryKeys = {
  // Resume queries
  resumes: {
    all: ["resumes"] as const,
    detail: (id: string) => ["resumes", id] as const,
  },
  // Analytics queries
  analytics: ["analytics"] as const,
  // User queries
  user: ["user"] as const,
} as const;
