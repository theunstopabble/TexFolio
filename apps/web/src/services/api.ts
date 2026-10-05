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

/**
 * Normalise an error payload into a string a toast can render.
 *
 * `@hono/zod-validator` answers validation failures with `c.json(result, 400)`,
 * so `data.error` is the raw SafeParseError OBJECT (`{ issues: [...] }`).
 * Passing that to toast.error() rendered "[object Object]" and can crash the
 * toast subtree — this turns it into e.g. "salary: Expected number".
 */
const extractErrorMessage = (value: unknown): string | undefined => {
  if (typeof value === "string") return value.trim() || undefined;

  if (value && typeof value === "object") {
    const issues = (
      value as {
        issues?: Array<{ path?: Array<string | number>; message?: string }>;
      }
    ).issues;

    if (Array.isArray(issues) && issues.length > 0) {
      const first = issues[0];
      const path =
        Array.isArray(first.path) && first.path.length > 0
          ? `${first.path.join(".")}: `
          : "";
      return `${path}${first.message || "Invalid input"}`;
    }

    const message = (value as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) return message.trim();
  }

  return undefined;
};

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
  async (error) => {
    if (error.response) {
      const { status, data, config } = error.response;
      let message: string | undefined;

      // responseType "blob" requests (PDF) carry JSON errors as a Blob —
      // read and parse it so the real server error is shown.
      if (config?.responseType === "blob" && data instanceof Blob) {
        try {
          const text = await data.text();
          const parsed = JSON.parse(text) as { error?: unknown; message?: unknown };
          message =
            extractErrorMessage(parsed.error) || extractErrorMessage(parsed.message);
        } catch {
          message = undefined;
        }
      }
      message =
        message ||
        extractErrorMessage(data?.error) ||
        extractErrorMessage(data?.message) ||
        "An unexpected error occurred";
      // Distinguishes "the server told us something useful" from the fallback
      // above, so the specific-code branches can prefer the real reason.
      const serverMessage =
        message !== "An unexpected error occurred" ? message : undefined;

      // Handle specific error codes. 403/404 prefer the server's own text: the
      // Pro-template gate answers 403 with why ("Premium templates require a
      // Pro subscription") and the resume routes answer 404 with which resource
      // was missing — a fixed sentence hid both.
      switch (status) {
        case 401:
          toast.error("Session expired. Please sign in again.");
          break;
        case 403:
          toast.error(
            serverMessage ||
              "You don't have permission to perform this action.",
          );
          break;
        case 404:
          toast.error(serverMessage || "Resource not found.");
          break;
        case 429:
          toast.error("Too many requests. Please wait a moment.");
          break;
        case 500:
          toast.error(serverMessage || "Server error. Please try again later.");
          break;
        default:
          toast.error(serverMessage || "An unexpected error occurred");
      }
    } else if (error.request) {
      // No response at all. ECONNABORTED is axios's own timeout rather than a
      // dropped connection — the PDF route compiles LaTeX synchronously, so a
      // 2-minute timeout can be hit by a legitimately slow build, which
      // "check your connection" misdiagnoses as a network fault.
      if (axios.isAxiosError(error) && error.code === "ECONNABORTED") {
        toast.error(
          "The request timed out. Please try again — PDF generation can take up to 2 minutes.",
        );
      } else {
        toast.error("Network error. Please check your connection.");
      }
    } else {
      // Other errors
      toast.error(error.message || "An unexpected error occurred");
    }

    // Every branch above has already shown a toast. Tag the rejection so
    // callers wrapping this promise can tell "already reported" from
    // "unhandled" — without it each failure produced two identical
    // notifications, one here and one in the caller's catch.
    Object.assign(error, { reported: true });

    return Promise.reject(error);
  }
);

/**
 * True when the response interceptor already surfaced `error` to the user.
 *
 * Used by the download paths, which both let axios report HTTP/network
 * failures and would otherwise add their own toast on top of it.
 */
export const isReportedError = (error: unknown): boolean =>
  typeof error === "object" && error !== null && "reported" in error;

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
    try {
      const response = await api.get(`/resumes/${id}/pdf`, {
        params: { t: Date.now() },
        responseType: "blob",
        // PDF generation can take longer than the 60s default (server compiles LaTeX)
        timeout: 120000,
      });
      return URL.createObjectURL(response.data);
    } catch (error) {
      // Server errors arrive as JSON even when responseType is "blob" — surface
      // the real message instead of the generic "Failed to generate PDF".
      //
      // The parse and the throw are deliberately in SEPARATE blocks: throwing
      // inside the try used to get caught by its own catch, so every server
      // message (including "LaTeX compile failed …" and the Pro-template 403)
      // was replaced by the fallback before it could leave this function.
      if (axios.isAxiosError(error) && error.response?.data instanceof Blob) {
        let parsed: { error?: unknown; message?: unknown } | undefined;
        try {
          const text = await error.response.data.text();
          parsed = JSON.parse(text) as { error?: unknown; message?: unknown };
        } catch {
          // Not JSON at all (an HTML error page, a truncated body) — fall
          // through to the generic message below.
          parsed = undefined;
        }
        throw Object.assign(
          new Error(
            extractErrorMessage(parsed?.error) ||
              extractErrorMessage(parsed?.message) ||
              "Failed to generate PDF",
          ),
          // The interceptor read this same blob and toasted it a moment ago;
          // reporting it again here would double the notification.
          { reported: true },
        );
      }
      throw error;
    }
  },

  // Revoke a blob URL to free memory
  revokePdfUrl: (url: string) => {
    URL.revokeObjectURL(url);
  },

  // Toggle Visibility
  toggleVisibility: (id: string) => api.patch(`/resumes/${id}/visibility`),

  saveAtsScore: (id: string, atsScore: number) =>
    api.patch(`/resumes/${id}/ats-score`, { atsScore }),

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

import type { ResumeFormData } from "../features/resume-editor/types";
import {
  normalizeForCoverLetter,
  normalizeForATSCheck,
} from "../features/resume-editor/lib/normalizeForAI";

export interface ATSAnalysisResult {
  score: number;
  summary: string;
  keywords_found: string[];
  keywords_missing: string[];
  formatting_issues: string[];
  suggestions: string[];
  /** Set when the model replied with unreadable JSON (score is not meaningful). */
  parseFailed?: boolean;
  /** Set when the AI service itself failed. */
  serviceUnavailable?: boolean;
}

export const aiApi = {
  /**
   * POST /ai/analyze — send the resume payload directly (NOT wrapped in
   * `{ resumeData }`). The caller must pass an already-normalized object
   * (use `normalizeResumeForAI(formState)` before calling).
   */
  analyze: (normalizedResume: ResumeFormData) =>
    api.post<unknown, { data: { data: ATSAnalysisResult } }>("/ai/analyze", normalizedResume),

  /**
   * POST /ai/cover-letter — accepts raw form state; normalises internally.
   */
  generateCoverLetter: (data: {
    resume: ResumeFormData;
    jobDescription: string;
    jobTitle?: string;
    company?: string;
  }) => {
    const normalized = normalizeForCoverLetter(
      data.resume,
      data.jobDescription,
      data.jobTitle,
      data.company,
    );
    return api.post("/ai/cover-letter", normalized);
  },

  improveText: (text: string, type?: "grammar" | "professional") =>
    api.post("/ai/improve", { text, type }),

  generateBullets: (jobTitle: string, skills?: string[]) =>
    api.post("/ai/generate-bullets", { jobTitle, skills }),

  /**
   * POST /ai/ats-check — accepts raw form state; normalises internally.
   */
  checkATSScore: (formState: ResumeFormData, jobDescription?: string) => {
    const normalized = normalizeForATSCheck(formState, jobDescription);
    return api.post<unknown, { data: { data: ATSAnalysisResult } }>("/ai/ats-check", normalized);
  },
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
