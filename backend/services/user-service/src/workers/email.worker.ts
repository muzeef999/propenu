import { Worker } from "bullmq";
import { redisConnection } from "../lib/redis.connection";
import { sendEmail } from "../../../../shared/email/email.service";

new Worker(
  "email-queue",
  async (job) => {
    console.log("🔥 JOB RECEIVED:", job.data);

    const { email, subject, html } = job.data;

    try {
      console.log("📩 Sending email to:", email);

      // ✅ REAL EMAIL SEND
      await sendEmail({
        to: email,
        subject,
        html,
      });

      console.log("✅ Email sent:", email);
    } catch (error) {
      console.error("❌ Email failed:", email, error);
      throw error; // important for retry
    }
  },
  {
    connection: redisConnection,
    concurrency: 3,
  }
);