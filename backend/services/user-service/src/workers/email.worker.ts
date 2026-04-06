import { Worker } from "bullmq";
import { redisConnection } from "../lib/redis.connection";

new Worker(
  "email-queue",
  async (job) => {
    const { email, name } = job.data;

    console.log("📩 Sending email to:", email);

    // simulate email
    await new Promise((res) => setTimeout(res, 1000));
  },
  {
    connection: redisConnection,
    concurrency: 3,
  }
);