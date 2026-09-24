import { Queue } from "bullmq";
import { redisConnection } from "../lib/redis.connection";

/** Per-recipient Meta send */
export interface WhatsAppSendJobData {
  to: string;
  templateName: string;
  variables: string[];
  language?: string;
  headerImageUrl?: string;
  headerMediaId?: string;
  headerFormat?: string;
  recordId?: string;
  logId?: string;
  campaignId?: string;
}

/** CRM audience fan-out (runs once per campaign after 202 Accepted) */
export interface WhatsAppCrmFanoutJobData {
  campaignId: string;
  templateName: string;
  language: string;
  variableCount: number;
  phoneKey: string;
  filter: Record<string, unknown>;
  requestedHeaderImageUrl?: string;
}

/** CSV/XLSX fan-out */
export interface WhatsAppCsvFanoutJobData {
  campaignId: string;
  templateName: string;
  language: string;
  category: string;
  expectedVars: number;
  fieldMapping: Record<string, string>;
  phoneField: string;
  baseDelayMs: number;
  requestedHeaderImageUrl?: string;
  rows: Record<string, string>[];
}

export type WhatsAppJobData =
  | WhatsAppSendJobData
  | WhatsAppCrmFanoutJobData
  | WhatsAppCsvFanoutJobData;

export const whatsappQueue = new Queue<WhatsAppJobData>("whatsapp-queue", {
  connection: redisConnection,
  defaultJobOptions: {
    removeOnComplete: 1000,
    removeOnFail: 5000,
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
  },
});
