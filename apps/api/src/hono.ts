import { Hono } from "hono";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import { serve } from "@hono/node-server";
import { env, connectDatabase, disconnectDatabase } from "./config/index.js";
import { rateLimiter } from "./middleware.hono/rate-limit.middleware.js";
import { requestIdMiddleware } from "./middleware.hono/request-id.middleware.js";
import { structuredLogger } from "./middleware.hono/logger.middleware.js";

// Import Hono routes
import { resumeRoutes } from "./routes.hono/resume.routes.js";
import { aiRoutes } from "./routes.hono/ai.routes.js";
import { analyticsRoutes } from "./routes.hono/analytics.routes.js";
import { paymentRoutes } from "./routes.hono/payment.routes.js";
import { authRoutes } from "./routes.hono/auth.routes.js";
import { publicRoutes } from "./routes.hono/public.routes.js";
import { agentRoutes } from "./routes.hono/agent.routes.js";

// Create Hono app
const app = new Hono();

// ============================================
// Middleware
// ============================================

// 1. Request ID tracking (must be first for correlation)
app.use("*", requestIdMiddleware);

// 2. Structured Logging (before business logic)
app.use("*", structuredLogger);

// 3. Security headers with enterprise hardening
app.use("*", secureHeaders());

// 4. CORS Hardening: Origin whitelist per environment
const allowedOrigins = env.CORS_ORIGIN
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  "*",
  cors({
    origin: (origin) => {
      // Allow requests with no origin (mobile/curl) or whitelisted origins
      if (!origin || allowedOrigins.includes(origin)) {
        return origin;
      }
      return null; // Block all others
    },
    credentials: true,
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "X-Request-ID"],
    exposeHeaders: ["X-Request-ID", "X-RateLimit-Limit", "Retry-After"],
  }),
);

// 5. Global Rate Limiter (increased for general API)
app.use(
  "/api/*",
  rateLimiter({
    windowMs: 60 * 1000, // 1 minute
    max: 120, // Limit each IP to 120 requests per minute
    message: "Too many requests, please try again after a minute.",
  }),
);

// Strict Rate Limiter for Sensitive Routes (Auth, Payments)
const strictLimiter = rateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // Limit to 5 requests per minute
  message: "Too many attempts, please try again after a minute.",
});

app.use("/api/auth/*", strictLimiter);
app.use("/api/payments/verify", strictLimiter);
app.use("/api/payments/create-order", strictLimiter);

// ============================================
// Routes
// ============================================

// Root route
app.get("/", (c) => {
  return c.json({
    success: true,
    message: "Welcome to TexFolio API 🚀 (Hono)",
    docs: "https://github.com/theunstopabble/TexFolio",
  });
});

// Health check
app.get("/health", (c) => {
  return c.json({
    success: true,
    message: "TexFolio API is running!",
    timestamp: new Date().toISOString(),
    runtime: "Hono",
  });
});

// Mount API routes
app.route("/api/public", publicRoutes);
app.route("/api/resumes", resumeRoutes);
app.route("/api/ai", aiRoutes);
app.route("/api/analytics", analyticsRoutes);
app.route("/api/payments", paymentRoutes);
app.route("/api/auth", authRoutes);
app.route("/api/agents", agentRoutes); // LangGraph AI Agent

// ============================================
// Error Handling
// ============================================

// 404 Handler
app.notFound((c) => {
  return c.json(
    {
      success: false,
      error: "Route not found",
    },
    404,
  );
});

// Global Error Handler - Enterprise (includes Request ID tracking)
app.onError((err, c) => {
  const requestId = c.get("requestId") || "unknown";
  
  // Log full error details server-side with correlation ID for debugging
  console.error(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      level: "error",
      message: "Unhandled exception",
      requestId,
      error: err.message,
      stack: err.stack,
    })
  );

  // In production, never expose internal error details to clients
  const isProduction = env.NODE_ENV === "production";
  const errorMessage = isProduction
    ? "Internal Server Error"
    : err.message || "Internal Server Error";

  return c.json(
    {
      success: false,
      error: errorMessage,
      requestId, // Include request ID for correlation
    },
    500,
  );
});

// ============================================
// Server Startup
// ============================================
// Server Startup
// ============================================

let server: ReturnType<typeof serve> | null = null;

const startServer = async (): Promise<void> => {
  try {
    // Connect to database
    await connectDatabase();

    // Start Hono server
    const port = Number(env.PORT) || 5000;
    console.log(`🚀 Hono Server running on http://localhost:${port}`);
    console.log(`📍 Environment: ${env.NODE_ENV}`);

    server = serve({
      fetch: app.fetch,
      port,
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

// Graceful shutdown handler
const gracefulShutdown = async (): Promise<void> => {
  console.log("\n🛑 Shutting down gracefully...");
  if (server) {
    server.close();
  }
  await disconnectDatabase();
  process.exit(0);
};

// Handle shutdown signals
process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);

// Start the server
startServer();

export default app;
