import mongoose from "mongoose";
import { env } from "./env.js";

// Force Google DNS to resolve connection issues (Only in Development)
import dns from "node:dns";
if (env.NODE_ENV === "development") {
  try {
    dns.setServers(["8.8.8.8", "8.8.4.4"]);
    console.log("🌐 Dev Mode: Using Google DNS (8.8.8.8)");
  } catch {
    // Ignore error if setServers is not supported
  }
}

// Connect to MongoDB
export const connectDatabase = async (): Promise<void> => {
  try {
    const connection = await mongoose.connect(env.MONGODB_URI);

    console.log(`✅ MongoDB Connected: ${connection.connection.host}`);

    // Handle connection events
    mongoose.connection.on("error", (error) => {
      console.error("❌ MongoDB connection error:", error);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("⚠️ MongoDB disconnected");
    });
  } catch (error) {
    console.error("❌ Failed to connect to MongoDB:", error);
    process.exit(1);
  }
};

// Graceful shutdown
export const disconnectDatabase = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    console.log("📤 MongoDB disconnected gracefully");
  } catch (error) {
    console.error("❌ Error during MongoDB disconnect:", error);
  }
};
