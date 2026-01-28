// Generic API response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Pagination parameters
export interface PaginationParams {
  page: number;
  limit: number;
}

// Paginated response
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Resume generation request
export interface GenerateResumeRequest {
  resumeId: string;
  templateId: string;
  format: 'pdf' | 'latex';
}

// Resume generation response
export interface GenerateResumeResponse {
  downloadUrl: string;
  expiresAt: Date;
}

// ATS check request
export interface ATSCheckRequest {
  resumeId: string;
  jobDescription?: string;
}

// User authentication
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    fullName: string;
  };
  accessToken: string;
  refreshToken: string;
}