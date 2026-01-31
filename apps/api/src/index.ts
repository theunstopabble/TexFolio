import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import { env, connectDatabase, disconnectDatabase } from "./config/index.js";
import apiRoutes from "./routes/index.js";

// Initialize Express app
const app: Application = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  }),
);

// Body parsing middleware
app.use(express.json());

app.use(express.urlencoded({ extended: true }));
// Rate Limiter
import { apiLimiter } from "./middleware/rate-limit.middleware.js";
app.use("/api", apiLimiter);

// API routes
app.use("/api", apiRoutes);

// Root route
app.get("/", (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "Welcome to TexFolio API 🚀",
    docs: "https://github.com/theunstopabble/TexFolio",
  });
});

// Health check endpoint
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "TexFolio API is running!",
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
import { errorMiddleware } from "./middleware/error.middleware.js";

// ... (other imports)

// 404 handler
app.use((_req: Request, _res: Response, next: NextFunction) => {
  const error = new Error("Route not found");
  (error as any).statusCode = 404;
  next(error);
});

// Global Error Handler
app.use(errorMiddleware);

// Start server
const startServer = async (): Promise<void> => {
  try {
    // Connect to database
    await connectDatabase();

    // Start listening
    app.listen(env.PORT, () => {
      console.log(`🚀 Server running on http://localhost:${env.PORT}`);
      console.log(`📍 Environment: ${env.NODE_ENV}`);
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
