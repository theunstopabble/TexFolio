import dotenv from "dotenv";
import { z } from "zod";

// Load .env file
dotenv.config();

// Define schema for environment variables
const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.string().default("5000"),
  MONGODB_URI: z.string().min(1, "MongoDB URI is required"),
  CLERK_SECRET_KEY: z.string().min(1, "Clerk Secret Key is required"),
  CLERK_PUBLISHABLE_KEY: z.string().min(1, "Clerk Publishable Key is required"),
  GROQ_API_KEY: z.string().optional(), // Groq Key for legacy AI
  GOOGLE_AI_API_KEY: z.string().optional(), // Google Gemini
  NVIDIA_API_KEY: z.string().optional(), // NVIDIA NIM (best free tier!)
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),
  BREVO_API_KEY: z.string().optional(),
  SENDER_EMAIL: z.string().email().optional(),
  PDFLATEX_PATH: z.string().optional(), // Path to pdflatex binary (defaults to 'pdflatex' in PATH)
  REDIS_URL: z.string().default("redis://localhost:6379"),
  API_KEY_SECRET: z.string().optional(), // HMAC secret for service-to-service API keys
});

// Parse and validate environment variables
const parseEnv = () => {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error("❌ Invalid environment variables:");
    console.error(result.error.format());
    process.exit(1);
  }

  return result.data;
};

// Export validated config
export const env = parseEnv();
