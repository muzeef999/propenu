// queues/email.queue.ts
import { Queue } from "bullmq";
import { redisConnection } from "../lib/redis.connection";

export const emailQueue = new Queue("email-queue", {
  connection: redisConnection,
});