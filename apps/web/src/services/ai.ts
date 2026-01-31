import api from "./api";

export interface ATSAnalysisResult {
  score: number;
  summary: string;
  keywords_found: string[];
  keywords_missing: string[];
  formatting_issues: string[];
  suggestions: string[];
}

export const analyzeResume = async (
  resumeData: any,
): Promise<AIAnalysisResult> => {
  const response = await api.post("/ai/analyze", resumeData);
  return response.data.data;
};
