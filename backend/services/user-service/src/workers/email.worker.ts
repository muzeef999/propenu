import dotenv from "dotenv";
dotenv.config();

import { Worker } from "bullmq";
import { sendEmail } from "../../../../shared/email/email.service";
import { EmailLog } from "../logs/emailLog.model";
import { redisConnection } from "../lib/redis.connection";

interface EmailJobData {
  to: string;
  subject: string;
  html: string;
  logId?: string;
  campaignId?: string;
}

new Worker<EmailJobData>(
  "email-queue",
  async (job) => {
    console.log("📨 Processing job:", job.id, job.data.to);

    try {
      await sendEmail(job.data.to, job.data.subject, job.data.html);

      console.log("✅ Email sent:", job.data.to);

      if (job.data.logId) {
        await EmailLog.findByIdAndUpdate(job.data.logId, {
          status: "success",
        });
      }
    } catch (err: any) {
      console.error("❌ Email failed:", job.data.to, err.message);

      if (job.data.logId) {
        await EmailLog.findByIdAndUpdate(job.data.logId, {
          status: "failed",
          error: err.message,
        });
      }

      throw err;
    }
  },
  {
    connection: redisConnection,
    concurrency: 1,

    // ✅ VERY SAFE FOR ZOHO
    limiter: {
      max: 5, // 5 emails
      duration: 60000, // per minute
    },
  }
);