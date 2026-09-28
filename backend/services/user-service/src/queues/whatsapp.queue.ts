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

/**
 * With maxRetriesPerRequest: null, queue.add waits forever while Redis is
 * unreachable, and nginx returns 504 at 60s. Fail fast instead.
 */
export async function addWhatsAppJobWithTimeout(
  ...args: Parameters<typeof whatsappQueue.add>
) {
  const timeoutMs = Number(process.env.QUEUE_ADD_TIMEOUT_MS || 10000);
  let timer: NodeJS.Timeout | undefined;
  try {
    return await Promise.race([
      whatsappQueue.add(...args),
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () =>
            reject(
              new Error(
                `Redis did not respond within ${timeoutMs / 1000}s — check REDIS_URL and that Redis is reachable from this server`,
              ),
            ),
          timeoutMs,
        );
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
