import dotenv from "dotenv";
dotenv.config();

import { Worker, Job } from "bullmq";
import { WhatsAppLog } from "../logs/whatsappLog.model.js";
import { redisConnection } from "../lib/redis.connection.js";
import { sendWhatsAppMessage } from "../../../../shared/whatsapp/templates/whatsappTemplate.service.js";
// ✅ Job type
interface WhatsAppJobData {
  to: string;
  templateName: string;
  variables: string[];
  recordId?: string;
  logId?: string;
  campaignId?: string;
}

console.log("🔥 WhatsApp Worker Started...");

// ✅ Worker
const worker = new Worker<WhatsAppJobData>(
  "whatsapp-queue",
  async (job: Job<WhatsAppJobData>) => {
    const { to, templateName, variables, logId } = job.data;

    console.log("📦 Job received:", job.data);

    try {
      // 🔥 Send message
      const response = await sendWhatsAppMessage({
        to,
        templateName,
        variables,
      });

      console.log("📬 Meta response:", response?.data);

      // ✅ Update log (success)
      if (logId) {
        await WhatsAppLog.findByIdAndUpdate(logId, {
          status: "success",
          response: response?.data,
        });
      }

      console.log("✅ Sent:", to);
    } catch (err: any) {
      console.error("❌ Failed:", to);
      console.error("❌ Error:", err?.response?.data || err.message);

      // ❌ Update log (failed)
      if (logId) {
        await WhatsAppLog.findByIdAndUpdate(logId, {
          status: "failed",
          error: err?.response?.data || err.message,
        });
      }

      // 🔥 IMPORTANT: rethrow for retry
      throw err;
    }
  },
  {
    connection: redisConnection,
    concurrency: 5,
  }
);

worker.on("completed", (job) => {
  console.log(`🎉 Job completed: ${job.id}`);
});

worker.on("failed", (job, err) => {
  console.log(`💥 Job failed: ${job?.id}`, err.message);
});

worker.on("error", (err) => {
  console.error("🚨 Worker error:", err);
});