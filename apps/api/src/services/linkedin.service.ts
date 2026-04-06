import pdf from "pdf-parse";
import { z } from "zod";
import { env } from "../config/env.js";
import Groq from "groq-sdk";

// Define the Resume Schema for structured output validation
const linkedInSchema = z.object({
  personalInfo: z.object({
    fullName: z.string().default(""),
    email: z.string().email().optional().or(z.literal("")),
    phone: z.string().optional().or(z.literal("")),
    linkedin: z.string().optional().or(z.literal("")),
    github: z.string().optional().or(z.literal("")),
    location: z.string().optional().or(z.literal("")),
  }),
  summary: z.string().optional().or(z.literal("")),
  experience: z
    .array(
      z.object({
        company: z.string().default(""),
        position: z.string().default(""),
        startDate: z.string().optional().or(z.literal("")),
        endDate: z.string().optional().or(z.literal("")),
        location: z.string().optional().or(z.literal("")),
        description: z.array(z.string()).default([]),
      }),
    )
    .default([]),
  education: z
    .array(
      z.object({
        institution: z.string().default(""),
        degree: z.string().default(""),
        field: z.string().default(""),
        startDate: z.string().optional().or(z.literal("")),
        endDate: z.string().optional().or(z.literal("")),
        location: z.string().optional().or(z.literal("")),
        gpa: z.string().optional().or(z.literal("")),
      }),
    )
    .default([]),
  skills: z
    .array(
      z.object({
        category: z.string().default("General"),
        skills: z.array(z.string()).default([]),
      }),
    )
    .default([]),
  projects: z
    .array(
      z.object({
        name: z.string().default(""),
        description: z.string().optional().or(z.literal("")),
        technologies: z.array(z.string()).default([]),
      }),
    )
    .default([]),
  certifications: z
    .array(
      z.object({
        name: z.string().default(""),
        issuer: z.string().optional().or(z.literal("")),
      }),
    )
    .default([]),
});

// Maximum PDF text length to process (prevents prompt injection via massive text)
const MAX_TEXT_LENGTH = 50000;

export const parseLinkedInPdf = async (pdfBuffer: Buffer) => {
  console.log("🚀 Starting LinkedIn PDF Parse...");
  try {
    // 1. Extract raw text from PDF
    console.log("📄 Step 1: Parsing PDF buffer...");
    let rawText = "";
    try {
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

    // Truncate text to prevent prompt injection via massive input
    if (rawText.length > MAX_TEXT_LENGTH) {
      console.warn(
        `⚠️ PDF text truncated from ${rawText.length} to ${MAX_TEXT_LENGTH} chars`,
      );
      rawText = rawText.substring(0, MAX_TEXT_LENGTH);
    }

    // 2. Initialize Groq client
    if (!env.GROQ_API_KEY || env.GROQ_API_KEY === "your-groq-api-key") {
      throw new Error("GROQ_API_KEY is not configured. Please set a valid API key.");
    }
    
    console.log("🤖 Step 2: Initializing Groq model...");
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
        "summary": "Full professional summary/about section text",
        "experience": [{
          "company": "Company Name",
          "position": "Job Title",
          "location": "Location",
          "startDate": "Mon YYYY",
          "endDate": "Present or Mon YYYY",
          "description": ["Achievement 1", "Achievement 2"]
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
          "category": "Category Name",
          "skills": ["Skill1", "Skill2"]
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
      - Extract the FULL Summary/About section text
      - For experience descriptions, extract ALL bullet points
      - Group skills into categories
      - Return ONLY the JSON object, no other text
    `;

    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `LinkedIn PDF Text:\n${rawText}\n--End of PDF Text--`,
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

      // Validate against schema to ensure safe output
      const validatedData = linkedInSchema.parse(parsedData);
      console.log("✅ JSON Parsed and validated successfully");
      return validatedData;
    } catch (parseError) {
      console.error("❌ Step 4 Failed: JSON parse/validation error", parseError);
      console.log("Raw AI Response:", jsonString);
      throw new Error("Failed to parse AI response");
    }
  } catch (error) {
    console.error("❌ LinkedIn Parse Flow Error:", error);
    throw error;
  }
};
