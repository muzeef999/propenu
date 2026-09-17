import { Queue } from "bullmq";
import { redisConnection } from "../lib/redis.connection";

export interface WhatsAppJobData {
  to: string;
  templateName: string;
  variables: string[];
  language?: string;
  headerImageUrl?: string;
  recordId?: string;
  logId?: string;
  campaignId?: string;
}

export const whatsappQueue = new Queue<WhatsAppJobData>("whatsapp-queue", {
  connection: redisConnection,
});
