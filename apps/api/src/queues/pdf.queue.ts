import { Queue, Worker, type Job } from "bullmq";
import { getRedisConnection, closeRedis } from "../config/redis.js";
import { env } from "../config/env.js";
import { generatePDF } from "../services/pdf.service.js";
import { Resume, Organization } from "../models/index.js";

interface PdfJobData {
  resumeId: string;
  userId: string;
  organizationId?: string;
}

let pdfWorker: Worker<PdfJobData> | null = null;
export let pdfQueue: Queue<PdfJobData> | null = null;

function isProduction(): boolean {
  return env.NODE_ENV === "production";
}

function getRedis(): ReturnType<typeof getRedisConnection> | null {
  return isProduction() ? getRedisConnection() : null;
}

function initPdfQueueIfProduction(): void {
  if (!isProduction()) {
    console.log("📄 PDF Queue skipped (local development - Redis not used)");
    return;
  }

  const redis = getRedis();
  if (!redis) {
    console.warn("⚠️ PDF Queue skipped (Redis unavailable)");
    return;
  }

  pdfQueue = new Queue("pdf-generation", {
    connection: redis,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 2000,
      },
      removeOnComplete: { count: 20 },
      removeOnFail: { count: 10 },
    },
  });

  pdfWorker = new Worker<PdfJobData>(
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
      connection: redis,
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

  console.log("📄 PDF Queue initialized");
}

export function initPdfQueue(): void {
  initPdfQueueIfProduction();
}

/**
 * Graceful shutdown helper for the worker.
 */
export async function closePdfQueue(): Promise<void> {
  if (pdfQueue) {
    await pdfQueue.close();
  }
  if (pdfWorker) {
    await pdfWorker.close();
  }
  await closeRedis();
}