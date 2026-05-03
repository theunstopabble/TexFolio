import { Queue, Worker, type Job } from "bullmq";
import { Redis } from "ioredis";
import { env } from "../config/env.js";
import { generatePDF } from "../services/pdf.service.js";
import { Resume, Organization } from "../models/index.js";

// Redis connection shared between queue and worker
const redisConnection = new Redis(env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

/**
 * BullMQ Queue for asynchronous PDF generation.
 * Offloads LaTeX compilation from the HTTP request thread,
 * enabling retries, progress tracking, and graceful timeouts.
 */
export const pdfQueue = new Queue("pdf-generation", {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 },
  },
});

interface PdfJobData {
  resumeId: string;
  userId: string;
  organizationId?: string;
}

/**
 * Enterprise PDF worker with structured error handling and logging.
 * Can be imported and run in-process or as a separate worker process.
 */
export const pdfWorker = new Worker<PdfJobData>(
  "pdf-generation",
  async (job: Job<PdfJobData>) => {
    const { resumeId, userId, organizationId } = job.data;
    const startTime = Date.now();

    await job.updateProgress(10);
    console.log(`[PDF Worker] Job ${job.id}: starting generation for resume ${resumeId}`);

    try {
      // Fetch resume and verify ownership
      const resumeDoc = await Resume.findOne({ _id: resumeId, userId });
      if (!resumeDoc) {
        throw new Error("Resume not found or access denied");
      }
      const resume = resumeDoc.toObject();

      // Fetch org branding if this is an org-owned resume
      let orgBranding: Parameters<typeof generatePDF>[2] | undefined;
      if (organizationId || resumeDoc.organizationId) {
        const org = await Organization.findById(organizationId || resumeDoc.organizationId);
        if (org) {
          orgBranding = {
            lockedTemplateId: org.branding?.lockedTemplateId,
            primaryColor: org.branding?.primaryColor,
            enforceCompanyFont: org.settings?.enforceCompanyFont,
          };
        }
      }

      await job.updateProgress(30);

      // Generate PDF with org branding applied
      const outputPath = await generatePDF(
        resume,
        resume.templateId || "classic",
        orgBranding,
      );

      await job.updateProgress(100);

      const duration = Date.now() - startTime;
      console.log(`[PDF Worker] Job ${job.id}: completed in ${duration}ms → ${outputPath}`);

      return { outputPath, durationMs: duration };
    } catch (error) {
      const duration = Date.now() - startTime;
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[PDF Worker] Job ${job.id}: failed after ${duration}ms - ${message}`);
      throw error;
    }
  },
  {
    connection: redisConnection,
    concurrency: 2,
    limiter: {
      max: 5,
      duration: 60000, // 5 PDFs per minute max
    },
  }
);

// Worker event listeners for observability
pdfWorker.on("completed", (job) => {
  console.log(`[PDF Worker] Job ${job.id} completed.`);
});

pdfWorker.on("failed", (job, err) => {
  console.error(`[PDF Worker] Job ${job?.id} failed:`, err.message);
});

pdfWorker.on("error", (err: Error) => {
  console.error("[PDF Worker] Unexpected worker error:", err.message);
});

/**
 * Graceful shutdown helper for the worker.
 */
export async function closePdfQueue(): Promise<void> {
  await pdfQueue.close();
  await pdfWorker.close();
  await redisConnection.quit();
}
