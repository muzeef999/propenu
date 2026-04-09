// src/lib/queue/email.queue.ts

import { Queue } from "bullmq";
import { redisConnection } from "../lib/redis.connection";

export interface EmailJobData {
  to: string;
  subject: string;
  html: string;
  recordId?: string; // ✅ ADD THIS
  logId?: string;      // ✅ add this
  campaignId?: string; // ✅ add this
}

export const emailQueue = new Queue<EmailJobData>("email-queue", {
  connection: redisConnection,
});