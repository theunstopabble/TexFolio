import { QueryClient } from "@tanstack/react-query";

// Create a centralized QueryClient with default options
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is considered fresh for 5 minutes
      staleTime: 5 * 60 * 1000,
      // Cache data for 30 minutes
      gcTime: 30 * 60 * 1000,
      // Retry failed requests up to 1 time (reduced from 3 for faster error feedback)
      retry: 1,
      // Don't refetch on window focus (better for form editing)
      refetchOnWindowFocus: false,
    },
    mutations: {
      // NEVER auto-retry mutations — they can create duplicate data (POST/PUT/DELETE)
      // If a mutation fails, the user should manually retry
      retry: 0,
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
