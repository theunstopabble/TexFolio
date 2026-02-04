import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import { serve } from "@hono/node-server";
import { env, connectDatabase, disconnectDatabase } from "./config/index.js";

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

// Logger
app.use("*", logger());

// Security headers
app.use("*", secureHeaders());

// CORS
app.use(
  "*",
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  }),
);

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

// Global Error Handler
app.onError((err, c) => {
  console.error("Error:", err);
  return c.json(
    {
      success: false,
      error: err.message || "Internal Server Error",
    },
    500,
  );
});

// ============================================
// Server Startup
// ============================================

const startServer = async (): Promise<void> => {
  try {
    // Connect to database
    await connectDatabase();

    // Start Hono server
    const port = Number(env.PORT) || 5000;
    console.log(`🚀 Hono Server running on http://localhost:${port}`);
    console.log(`📍 Environment: ${env.NODE_ENV}`);

    serve({
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
  await disconnectDatabase();
  process.exit(0);
};

// Handle shutdown signals
process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);

// Start the server
startServer();

export default app;
