import { StateGraph, Annotation, END, START } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import {
  HumanMessage,
  AIMessage,
  SystemMessage,
} from "@langchain/core/messages";
import { env } from "../config/env.js";

// ============================================
// LLM Provider Configuration
// ============================================

/**
 * Create LLM instance based on available API keys
 * Priority: NVIDIA NIM > Google Gemini > Groq (fallback)
 */
const createLLM = () => {
  // NVIDIA NIM (OpenAI-compatible) - Best free tier!
  if (env.NVIDIA_API_KEY) {
    console.log("🎮 Using NVIDIA NIM (Llama 3.1)");
    return new ChatOpenAI({
      model: "meta/llama-3.1-70b-instruct",
      apiKey: env.NVIDIA_API_KEY,
      configuration: {
        baseURL: "https://integrate.api.nvidia.com/v1",
      },
      temperature: 0.7,
    });
  }

  // Google Gemini
  if (env.GOOGLE_AI_API_KEY) {
    console.log("🔮 Using Google Gemini");
    // Gemini via OpenAI-compatible endpoint
    return new ChatOpenAI({
      model: "gemini-1.5-flash",
      apiKey: env.GOOGLE_AI_API_KEY,
      configuration: {
        baseURL: "https://generativelanguage.googleapis.com/v1beta/openai",
      },
      temperature: 0.7,
    });
  }

  // Groq (existing)
  if (env.GROQ_API_KEY) {
    console.log("⚡ Using Groq");
    return new ChatOpenAI({
      model: "llama-3.1-70b-versatile",
      apiKey: env.GROQ_API_KEY,
      configuration: {
        baseURL: "https://api.groq.com/openai/v1",
      },
      temperature: 0.7,
    });
  }

  throw new Error(
    "No AI API key configured. Set NVIDIA_API_KEY, GOOGLE_AI_API_KEY, or GROQ_API_KEY",
  );
};

// ============================================
// State Definition
// ============================================

/**
 * Resume Coach Agent State
 * Tracks the conversation and resume analysis progress
 */
const ResumeCoachState = Annotation.Root({
  // Input resume data
  resumeData: Annotation<Record<string, any>>({
    reducer: (_, y) => y,
    default: () => ({}),
  }),

  // Job description for tailoring (optional)
  jobDescription: Annotation<string>({
    reducer: (_, y) => y,
    default: () => "",
  }),

  // Conversation messages
  messages: Annotation<(HumanMessage | AIMessage | SystemMessage)[]>({
    reducer: (x, y) => [...x, ...y],
    default: () => [],
  }),

  // Current analysis phase
  currentPhase: Annotation<string>({
    reducer: (_, y) => y,
    default: () => "initial",
  }),

  // Analysis results from each phase
  analysisResults: Annotation<{
    contentAnalysis?: {
      score: number;
      feedback: string[];
    };
    atsAnalysis?: {
      score: number;
      keywords: string[];
      missing: string[];
    };
    formatAnalysis?: {
      score: number;
      issues: string[];
    };
    impactAnalysis?: {
      score: number;
      suggestions: string[];
    };
  }>({
    reducer: (x, y) => ({ ...x, ...y }),
    default: () => ({}),
  }),

  // Final recommendations
  finalScore: Annotation<number>({
    reducer: (_, y) => y,
    default: () => 0,
  }),

  recommendations: Annotation<string[]>({
    reducer: (x, y) => [...x, ...y],
    default: () => [],
  }),

  // Error tracking
  error: Annotation<string | null>({
    reducer: (_, y) => y,
    default: () => null,
  }),
});

type ResumeCoachStateType = typeof ResumeCoachState.State;

// ============================================
// Agent Nodes
// ============================================

/**
 * Node 1: Content Analysis
 * Analyzes the actual content quality of the resume
 */
async function analyzeContent(
  state: ResumeCoachStateType,
): Promise<Partial<ResumeCoachStateType>> {
  const llm = createLLM();

  const systemPrompt = `You are an expert resume content reviewer. Analyze the resume content for:
1. Clarity and conciseness of descriptions
2. Use of action verbs and quantifiable achievements
3. Relevance and completeness of information
4. Professional summary effectiveness

Resume Data:
${JSON.stringify(state.resumeData, null, 2)}

Respond with ONLY valid JSON in this format:
{
  "score": <number 0-100>,
  "feedback": ["feedback item 1", "feedback item 2", ...]
}`;

  try {
    const response = await llm.invoke([new SystemMessage(systemPrompt)]);
    const content = response.content as string;

    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      return {
        analysisResults: {
          contentAnalysis: {
            score: result.score,
            feedback: result.feedback,
          },
        },
        currentPhase: "ats",
        messages: [
          new AIMessage(
            `Content analysis complete. Score: ${result.score}/100`,
          ),
        ],
      };
    }
  } catch (error) {
    console.error("Content analysis error:", error);
  }

  return {
    analysisResults: {
      contentAnalysis: { score: 0, feedback: ["Analysis failed"] },
    },
    currentPhase: "ats",
  };
}

/**
 * Node 2: ATS Compatibility Check
 * Checks resume for ATS (Applicant Tracking System) compatibility
 */
async function analyzeATS(
  state: ResumeCoachStateType,
): Promise<Partial<ResumeCoachStateType>> {
  const llm = createLLM();

  const jobContext = state.jobDescription
    ? `\n\nTarget Job Description:\n${state.jobDescription}`
    : "";

  const systemPrompt = `You are an ATS (Applicant Tracking System) expert. Analyze this resume for ATS compatibility:
1. Keyword optimization
2. Standard section headers
3. Simple formatting compatibility
4. Skills matching${jobContext}

Resume Data:
${JSON.stringify(state.resumeData, null, 2)}

Respond with ONLY valid JSON:
{
  "score": <number 0-100>,
  "keywords": ["found keyword 1", ...],
  "missing": ["missing keyword 1", ...]
}`;

  try {
    const response = await llm.invoke([new SystemMessage(systemPrompt)]);
    const content = response.content as string;

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      return {
        analysisResults: {
          atsAnalysis: {
            score: result.score,
            keywords: result.keywords,
            missing: result.missing,
          },
        },
        currentPhase: "format",
        messages: [
          new AIMessage(`ATS analysis complete. Score: ${result.score}/100`),
        ],
      };
    }
  } catch (error) {
    console.error("ATS analysis error:", error);
  }

  return {
    analysisResults: {
      atsAnalysis: { score: 0, keywords: [], missing: [] },
    },
    currentPhase: "format",
  };
}

/**
 * Node 3: Format Analysis
 * Reviews resume structure and visual layout
 */
async function analyzeFormat(
  state: ResumeCoachStateType,
): Promise<Partial<ResumeCoachStateType>> {
  const llm = createLLM();

  const systemPrompt = `You are a resume formatting expert. Analyze this resume structure:
1. Section organization and order
2. Information hierarchy
3. Consistency in formatting
4. Length appropriateness

Resume Data:
${JSON.stringify(state.resumeData, null, 2)}

Respond with ONLY valid JSON:
{
  "score": <number 0-100>,
  "issues": ["issue 1", "issue 2", ...]
}`;

  try {
    const response = await llm.invoke([new SystemMessage(systemPrompt)]);
    const content = response.content as string;

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      return {
        analysisResults: {
          formatAnalysis: {
            score: result.score,
            issues: result.issues,
          },
        },
        currentPhase: "impact",
        messages: [
          new AIMessage(`Format analysis complete. Score: ${result.score}/100`),
        ],
      };
    }
  } catch (error) {
    console.error("Format analysis error:", error);
  }

  return {
    analysisResults: {
      formatAnalysis: { score: 0, issues: [] },
    },
    currentPhase: "impact",
  };
}

/**
 * Node 4: Impact Analysis
 * Evaluates the overall impact and effectiveness
 */
async function analyzeImpact(
  state: ResumeCoachStateType,
): Promise<Partial<ResumeCoachStateType>> {
  const llm = createLLM();

  const systemPrompt = `You are a career coach analyzing resume impact. Evaluate:
1. First impression strength
2. Career progression clarity
3. Unique value proposition
4. Call-to-action effectiveness

Resume Data:
${JSON.stringify(state.resumeData, null, 2)}

Respond with ONLY valid JSON:
{
  "score": <number 0-100>,
  "suggestions": ["improvement 1", "improvement 2", ...]
}`;

  try {
    const response = await llm.invoke([new SystemMessage(systemPrompt)]);
    const content = response.content as string;

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      return {
        analysisResults: {
          impactAnalysis: {
            score: result.score,
            suggestions: result.suggestions,
          },
        },
        currentPhase: "synthesize",
        messages: [
          new AIMessage(`Impact analysis complete. Score: ${result.score}/100`),
        ],
      };
    }
  } catch (error) {
    console.error("Impact analysis error:", error);
  }

  return {
    analysisResults: {
      impactAnalysis: { score: 0, suggestions: [] },
    },
    currentPhase: "synthesize",
  };
}

/**
 * Node 5: Synthesize Results
 * Combines all analyses into final recommendations
 */
async function synthesizeResults(
  state: ResumeCoachStateType,
): Promise<Partial<ResumeCoachStateType>> {
  const { analysisResults } = state;

  // Calculate weighted average score
  const scores = [
    (analysisResults.contentAnalysis?.score || 0) * 0.3,
    (analysisResults.atsAnalysis?.score || 0) * 0.25,
    (analysisResults.formatAnalysis?.score || 0) * 0.2,
    (analysisResults.impactAnalysis?.score || 0) * 0.25,
  ];

  const finalScore = Math.round(scores.reduce((a, b) => a + b, 0));

  // Compile top recommendations
  const recommendations: string[] = [];

  // Add top feedback from each category
  analysisResults.contentAnalysis?.feedback
    ?.slice(0, 2)
    .forEach((f) => recommendations.push(`📝 Content: ${f}`));

  analysisResults.atsAnalysis?.missing
    ?.slice(0, 2)
    .forEach((m) => recommendations.push(`🔍 ATS: Add keyword "${m}"`));

  analysisResults.formatAnalysis?.issues
    ?.slice(0, 2)
    .forEach((i) => recommendations.push(`📋 Format: ${i}`));

  analysisResults.impactAnalysis?.suggestions
    ?.slice(0, 2)
    .forEach((s) => recommendations.push(`💡 Impact: ${s}`));

  return {
    finalScore,
    recommendations,
    currentPhase: "complete",
    messages: [
      new AIMessage(`Analysis complete! Final Score: ${finalScore}/100`),
    ],
  };
}

// ============================================
// Graph Construction
// ============================================

/**
 * Create the Resume Coach Agent Graph
 */
export function createResumeCoachAgent() {
  const workflow = new StateGraph(ResumeCoachState)
    // Add nodes
    .addNode("content", analyzeContent)
    .addNode("ats", analyzeATS)
    .addNode("format", analyzeFormat)
    .addNode("impact", analyzeImpact)
    .addNode("synthesize", synthesizeResults)

    // Add edges
    .addEdge(START, "content")
    .addEdge("content", "ats")
    .addEdge("ats", "format")
    .addEdge("format", "impact")
    .addEdge("impact", "synthesize")
    .addEdge("synthesize", END);

  return workflow.compile();
}

// ============================================
// Agent Execution Helper
// ============================================

export interface ResumeCoachInput {
  resumeData: Record<string, any>;
  jobDescription?: string;
}

export interface ResumeCoachOutput {
  finalScore: number;
  analysisResults: {
    contentAnalysis?: { score: number; feedback: string[] };
    atsAnalysis?: { score: number; keywords: string[]; missing: string[] };
    formatAnalysis?: { score: number; issues: string[] };
    impactAnalysis?: { score: number; suggestions: string[] };
  };
  recommendations: string[];
}

/**
 * Run the Resume Coach Agent
 * @param input Resume data and optional job description
 * @returns Analysis results with score and recommendations
 */
export async function runResumeCoach(
  input: ResumeCoachInput,
): Promise<ResumeCoachOutput> {
  const agent = createResumeCoachAgent();

  const result = await agent.invoke({
    resumeData: input.resumeData,
    jobDescription: input.jobDescription || "",
    currentPhase: "initial",
  });

  return {
    finalScore: result.finalScore,
    analysisResults: result.analysisResults,
    recommendations: result.recommendations,
  };
}
