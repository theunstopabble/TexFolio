import Groq from "groq-sdk";
import { IResume } from "../models/resume.model.js";
import { env } from "../config/env.js";

export class AIService {
  private groq: Groq;

  constructor() {
    if (!env.GROQ_API_KEY) {
      console.warn("⚠️ GROQ_API_KEY is missing!");
    }
    this.groq = new Groq({
      apiKey: env.GROQ_API_KEY || "dummy-key",
    });
  }

  async analyzeResume(resume: IResume) {
    if (!env.GROQ_API_KEY) {
      throw new Error("AI Service unavailable: Groq API Key required.");
    }

    const prompt = `
      Act as an expert Resume Reviewer and ATS (Applicant Tracking System) Specialist.
      Analyze the following resume JSON and provide actionable feedback.
      
      RESUME DATA:
      ${JSON.stringify(resume, null, 2)}
      
      Output MUST be a valid JSON object with this exact structure:
      {
        "atsScore": number (0-100),
        "summaryFeedback": "string (2-3 sentences max)",
        "improvements": [
          {
            "section": "string (e.g. Experience, Skills)",
            "tip": "string (concise actionable advice)"
          }
        ]
      }
      
      Do not include markdown ticks or explanations. Just return the raw JSON.
    `;

    try {
      const chatCompletion = await this.groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content:
              "You are a helpful assistant that outputs only valid JSON.",
          },
          { role: "user", content: prompt },
        ],
        model: "llama-3.1-8b-instant", // Updated to supported model
        temperature: 0.5,
      });

      let text = chatCompletion.choices[0]?.message?.content || "{}";

      // Cleanup markdown code blocks if present
      text = text
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      console.log("✅ Groq Analysis Success");
      return JSON.parse(text);
    } catch (error: any) {
      console.error("Groq Analysis Failed:", error);
      throw new Error(
        "Failed to analyze resume with Groq. Please check API Key.",
      );
    }
  }

  async generateCoverLetter(resume: IResume, jobDescription: string) {
    if (!env.GROQ_API_KEY) {
      throw new Error("AI Service unavailable: Groq API Key required.");
    }

    const prompt = `
      Act as a professional Resume Writer and Career Coach.
      Write a compelling, professional cover letter based on the following Resume and Job Description.
      
      RESUME DATA:
      ${JSON.stringify(resume, null, 2)}
      
      JOB DESCRIPTION:
      ${jobDescription}
      
      REQUIREMENTS:
      1. Tone: Professional, confident, and tailored to the job.
      2. Content: meaningful connections between the candidate's skills/experience and the job requirements.
      3. Format: Markdown. Use standard cover letter formatting (Dear Hiring Manager, Body, Sincerely).
      4. Length: 300-400 words.
      
      Output ONLY the Markdown text of the cover letter. No preamble.
    `;

    try {
      const chatCompletion = await this.groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "You are a professional career coach.",
          },
          { role: "user", content: prompt },
        ],
        model: "llama-3.1-8b-instant",
        temperature: 0.7,
      });

      return chatCompletion.choices[0]?.message?.content || "";
    } catch (error: any) {
      console.error("Groq Cover Letter Generation Failed:", error);
      throw new Error("Failed to generate cover letter.");
    }
  }
}

export const aiService = new AIService();
