import axios from "axios";

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

export const setTokenProvider = (provider: () => Promise<string | null>) => {
  getToken = provider;
};

// Add auth token to requests
api.interceptors.request.use(async (config) => {
  if (getToken) {
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

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

  // Generate PDF - returns blob URL
  generatePdf: async (id: string) => {
    const response = await api.get(`/resumes/${id}/pdf`, {
      responseType: "blob",
    });
    return URL.createObjectURL(response.data);
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
  analyze: (data: any) => api.post("/ai/analyze", data),
  generateCoverLetter: (data: {
    resume: any;
    jobDescription: string;
    jobTitle?: string;
    company?: string;
  }) => api.post("/ai/cover-letter", data),
  improveText: (text: string) => api.post("/ai/improve", { text }),
  generateBullets: (jobTitle: string) =>
    api.post("/ai/generate-bullets", { jobTitle }),
  checkATSScore: (data: any) => api.post("/ai/ats-check", data),
};

export const paymentApi = {
  createOrder: (amount: number) => api.post("/payments/order", { amount }),
  verifyPayment: (data: unknown) => api.post("/payments/verify", data),
};

export default api;
