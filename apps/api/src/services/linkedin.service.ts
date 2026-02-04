import { createRequire } from "module";
const require = createRequire(import.meta.url);
// pdf-parse v1 has simple API: pdf(buffer) => { text, info, ... }
const pdf = require("pdf-parse");
import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";
import { env } from "../config/env.js";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

// Define the Resume Schema for structured output
// (Simplified version of IResume to map LinkedIn data)
const linkedInSchema = z.object({
  personalInfo: z.object({
    fullName: z.string(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    linkedin: z.string().optional(),
    location: z.string().optional(),
    summary: z.string().optional(),
  }),
  experience: z
    .array(
      z.object({
        company: z.string(),
        position: z.string(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        location: z.string().optional(),
        description: z.array(z.string()).default([]),
      }),
    )
    .default([]),
  education: z
    .array(
      z.object({
        institution: z.string(),
        degree: z.string(),
        field: z.string(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }),
    )
    .default([]),
  skills: z
    .array(
      z.object({
        category: z.string().default("General"),
        skills: z.array(z.string()),
      }),
    )
    .default([]),
});

export const parseLinkedInPdf = async (pdfBuffer: Buffer) => {
  console.log("🚀 Starting LinkedIn PDF Parse...");
  try {
    // 1. Extract raw text from PDF
    console.log("📄 Step 1: Parsing PDF buffer...");
    let rawText = "";
    try {
      // pdf-parse v1: simple function call
      const data = await pdf(pdfBuffer);
      rawText = data.text;
      console.log("✅ PDF Parsed. Text length:", rawText?.length);
    } catch (pdfError) {
      console.error("❌ Step 1 Failed: PDF extraction error", pdfError);
      throw new Error("Failed to extract text from PDF");
    }

    if (!rawText || rawText.length < 50) {
      throw new Error("PDF appears to be empty or unreadable");
    }

    // 2. Initialize AI Model (Using Groq - fast and reliable)
    console.log("🤖 Step 2: Initializing Groq model...");
    const Groq = require("groq-sdk");
    const groq = new Groq({ apiKey: env.GROQ_API_KEY });

    // 3. Prompt for Extraction
    console.log("📤 Step 3: Sending to AI...");
    const systemPrompt = `
      You are an expert Resume Parser. Extract ALL structured data from this LinkedIn PDF.
      Return ONLY valid JSON (no markdown code blocks) matching this structure:
      {
        "personalInfo": {
          "fullName": "Full Name",
          "email": "email@example.com",
          "phone": "",
          "location": "City, Country",
          "linkedin": "linkedin username or url",
          "github": ""
        },
        "summary": "Full professional summary/about section - include ALL text from Summary/About section",
        "experience": [{
          "company": "Company Name",
          "position": "Job Title",
          "location": "Location",
          "startDate": "Mon YYYY",
          "endDate": "Present or Mon YYYY",
          "description": ["Achievement 1", "Achievement 2", "..."]
        }],
        "education": [{
          "institution": "University Name",
          "degree": "Degree Type",
          "field": "Field of Study",
          "location": "",
          "startDate": "YYYY",
          "endDate": "YYYY",
          "gpa": ""
        }],
        "skills": [{
          "category": "Category Name (e.g., Languages, Frameworks, Tools)",
          "skills": ["Skill1", "Skill2", "..."]
        }],
        "projects": [{
          "name": "Project Name",
          "description": "Project description",
          "technologies": ["Tech1", "Tech2"]
        }],
        "certifications": [{
          "name": "Certification Name",
          "issuer": "Issuer Name"
        }]
      }

      IMPORTANT RULES:
      - Extract the FULL Summary/About section text - do not truncate it
      - For experience descriptions, extract ALL bullet points and achievements
      - Group skills into categories (Languages, Frameworks, Databases, Tools, etc.)
      - Extract ALL certifications listed
      - Extract ALL projects mentioned
      - Dates should be in "Mon YYYY" format (e.g., "Aug 2025")
    `;

    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Starting of PDF Text:\n${rawText}\n--End of PDF Text--`,
        },
      ],
      temperature: 0,
      max_tokens: 4096,
    });

    console.log("📥 Step 4: AI Response received");

    // 4. Parse JSON Response
    let jsonString = response.choices[0]?.message?.content || "";
    // Clean up potential markdown code blocks
    jsonString = jsonString
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    try {
      const parsedData = JSON.parse(jsonString);
      console.log("✅ JSON Parsed successfully");
      return parsedData;
    } catch (parseError) {
      console.error("❌ Step 4 Failed: JSON parse error", parseError);
      console.log("Raw AI Response:", jsonString);
      throw new Error("Failed to parse AI response");
    }
  } catch (error) {
    console.error("❌ LinkedIn Parse Flow Error:", error);
    throw error;
  }
};
