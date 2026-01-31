import api from "./api";

export interface AIAnalysisResult {
  atsScore: number;
  summaryFeedback: string;
  improvements: {
    section: string;
    tip: string;
  }[];
}

export const analyzeResume = async (
  resumeData: any,
): Promise<AIAnalysisResult> => {
  const response = await api.post("/ai/analyze", resumeData);
  return response.data.data;
};
