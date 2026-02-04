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
        "score": number (0-100),
        "summary": "string (2-3 sentences max)",
        "keywords_found": ["keyword1", "keyword2"],
        "keywords_missing": ["keyword1", "keyword2"],
        "formatting_issues": ["issue1", "issue2"],
        "suggestions": ["tip1", "tip2", "tip3"]
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
      5. Do not use placeholders like [Your Name] if the name is available in the resume. 
      
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
  async improveText(
    text: string,
    type: "grammar" | "professional" = "professional",
  ) {
    if (!env.GROQ_API_KEY) {
      throw new Error("AI Service unavailable: Groq API Key required.");
    }

    const sysPrompt =
      type === "grammar"
        ? "Fix grammar and spelling mistakes. Keep the tone natural."
        : "Rewrite this text to be professional, action-oriented, and suitable for a manufacturing/tech resume. Keep it concise.";

    const prompt = `
      ${sysPrompt}
      
      Original Text: "${text}"
      
      Output ONLY the improved text. No quotes, no preamble.
    `;

    try {
      const chatCompletion = await this.groq.chat.completions.create({
        messages: [
          { role: "system", content: "You are a professional resume editor." },
          { role: "user", content: prompt },
        ],
        model: "llama-3.1-8b-instant",
        temperature: 0.3,
      });

      return chatCompletion.choices[0]?.message?.content || text;
    } catch (error: any) {
      console.error("Groq Text Improvement Failed:", error);
      throw new Error("Failed to improve text.");
    }
  }

  async generateBullets(jobTitle: string, skills?: string[]) {
    if (!env.GROQ_API_KEY) {
      throw new Error("AI Service unavailable: Groq API Key required.");
    }

    const prompt = `
      Generate 5 strong, quantifiable, and action-oriented bullet points for a "${jobTitle}" role.
      ${skills?.length ? `Incorporate these skills: ${skills.join(", ")}.` : ""}
      
      Output MUST be a valid JSON array of strings:
      ["Developed...", "Managed...", "Optimized..."]
      
      Do not include markdown ticks. Just the raw JSON.
    `;

    try {
      const chatCompletion = await this.groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content:
              "You are a helpful assistant that outputs only valid JSON array.",
          },
          { role: "user", content: prompt },
        ],
        model: "llama-3.1-8b-instant",
        temperature: 0.6,
      });

      let text = chatCompletion.choices[0]?.message?.content || "[]";
      text = text
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      return JSON.parse(text);
    } catch (error: any) {
      console.error("Groq Bullet Generation Failed:", error);
      // Fallback
      return ["Failed to generate suggestions. Please try again."];
    }
  }

  async calculateATSScore(
    resumeData: any,
    jobDescription?: string,
  ): Promise<any> {
    const resumeText = JSON.stringify(resumeData);

    const prompt = `Analyze this resume data for ATS (Applicant Tracking System) compatibility.
    ${jobDescription ? `Job Description: ${jobDescription}` : ""}
    Resume Data: ${resumeText}

    Return a JSON object with the following structure (do not add any markdown formatting or extra text, just the RAW JSON):
    {
      "score": number, // 0-100 based on keywords, impact, and formatting
      "summary": string, // Brief summary of analysis (max 2 sentences)
      "keywords_found": string[], // Important keywords found in the resume
      "keywords_missing": string[], // Important keywords missing (if JD provided) or general suggestions
      "formatting_issues": string[], // Potential parsing issues
      "suggestions": string[] // 3-5 actionable improvements
    }`;

    try {
      const response = await this.groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content:
              "You are an expert ATS scanner and resume analyzer. Return purely JSON output.",
          },
          { role: "user", content: prompt },
        ],
        model: "llama-3.1-8b-instant",
        temperature: 0.3,
        response_format: { type: "json_object" },
      });

      const content = response.choices[0]?.message?.content || "{}";
      return JSON.parse(content);
    } catch (error) {
      console.error("ATS Score Calculation Failed:", error);
      // Return a dummy result on failure
      return {
        score: 0,
        summary: "Could not calculate score due to AI service error.",
        keywords_found: [],
        keywords_missing: [],
        formatting_issues: [],
        suggestions: ["Please try again later."],
      };
    }
  }
}

export const aiService = new AIService();
