import { Queue } from "bullmq";
import { redisConnection } from "../lib/redis.connection";

// ✅ Job Data Type
export interface WhatsAppJobData {
  to: string;                    // phone number
  templateName: string;          // meta template name
  variables: string[];           // template variables

  recordId?: string;             // optional (CRM record)
  logId?: string;                // optional (logging)
  campaignId?: string;           // optional (bulk campaign)
}

// ✅ Queue Instance
export const whatsappQueue = new Queue<WhatsAppJobData>(
  "whatsapp-queue",
  {
    connection: redisConnection,
  }
);