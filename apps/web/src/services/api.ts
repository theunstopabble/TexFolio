import axios from "axios";
import toast from "react-hot-toast";

// Base API URL
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 60000, // 60 seconds timeout for PDF generation
});

// Token provider to be set by the app
let getToken: (() => Promise<string | null>) | null = null;
let getActiveOrgId: (() => string | null) | null = null;

export const setTokenProvider = (provider: () => Promise<string | null>) => {
  getToken = provider;
};

export const setOrgIdProvider = (provider: () => string | null) => {
  getActiveOrgId = provider;
};

// Add auth token + active org header to requests
api.interceptors.request.use(async (config) => {
  if (getToken) {
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  if (getActiveOrgId) {
    const orgId = getActiveOrgId();
    if (orgId) {
      config.headers["X-Organization-Id"] = orgId;
    }
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      const message = data?.error || data?.message || "An unexpected error occurred";
      
      // Handle specific error codes
      switch (status) {
        case 401:
          toast.error("Session expired. Please sign in again.");
          break;
        case 403:
          toast.error("You don't have permission to perform this action.");
          break;
        case 404:
          toast.error("Resource not found.");
          break;
        case 429:
          toast.error("Too many requests. Please wait a moment.");
          break;
        case 500:
          toast.error("Server error. Please try again later.");
          break;
        default:
          toast.error(message);
      }
    } else if (error.request) {
      // Network error - no response from server
      toast.error("Network error. Please check your connection.");
    } else {
      // Other errors
      toast.error(error.message || "An unexpected error occurred");
    }
    
    return Promise.reject(error);
  }
);

// Resume APIs
export const resumeApi = {
  // Get all resumes
  getAll: () => api.get("/resumes"),

  // Get single resume
  getById: (id: string) => api.get(`/resumes/${id}`),

  // Create new resume
  create: (data: unknown) => api.post("/resumes", data),

  // Update resume
  update: (id: string, data: unknown) => api.put(`/resumes/${id}`, data),

  // Delete resume
  delete: (id: string) => api.delete(`/resumes/${id}`),

  // Generate PDF - returns blob URL (caller MUST revoke after use)
  generatePdf: async (id: string) => {
    const response = await api.get(`/resumes/${id}/pdf`, {
      responseType: "blob",
    });
    return URL.createObjectURL(response.data);
  },

  // Revoke a blob URL to free memory
  revokePdfUrl: (url: string) => {
    URL.revokeObjectURL(url);
  },

  // Toggle Visibility
  toggleVisibility: (id: string) => api.patch(`/resumes/${id}/visibility`),

  // Send Email
  sendEmail: (id: string, email: string) =>
    api.post(`/resumes/${id}/email`, { email }),
};
export const authApi = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post("/auth/register", data),
  login: (data: { email: string; password: string }) =>
    api.post("/auth/login", data),
  getMe: () => api.get("/auth/me"),
};

export const analyticsApi = {
  getStats: () => api.get("/analytics"),
};

export const aiApi = {
  analyze: (data: Record<string, unknown>) => api.post("/ai/analyze", data),
  generateCoverLetter: (data: {
    resume: Record<string, unknown>;
    jobDescription: string;
    jobTitle?: string;
    company?: string;
  }) => api.post("/ai/cover-letter", data),
  improveText: (text: string) => api.post("/ai/improve", { text }),
  generateBullets: (jobTitle: string) =>
    api.post("/ai/generate-bullets", { jobTitle }),
  checkATSScore: (data: Record<string, unknown>) => api.post("/ai/ats-check", data),
};

export const paymentApi = {
  createOrder: (amount: number) =>
    api.post("/payments/create-order", { amount }),
  verifyPayment: (data: unknown) => api.post("/payments/verify", data),
};

export const organizationApi = {
  list: () => api.get("/organizations"),
  getById: (id: string) => api.get(`/organizations/${id}`),
  create: (data: { name: string; slug: string }) => api.post("/organizations", data),
  update: (id: string, data: unknown) => api.put(`/organizations/${id}`, data),
  delete: (id: string) => api.delete(`/organizations/${id}`),
  listMembers: (id: string) => api.get(`/organizations/${id}/members`),
  inviteMember: (id: string, data: { userId: string; role: string }) =>
    api.post(`/organizations/${id}/members`, data),
  updateMemberRole: (id: string, userId: string, role: string) =>
    api.put(`/organizations/${id}/members/${userId}`, { role }),
  removeMember: (id: string, userId: string) =>
    api.delete(`/organizations/${id}/members/${userId}`),
  getOrgResumes: (id: string) => api.get(`/organizations/${id}/resumes`),
};

export default api;
