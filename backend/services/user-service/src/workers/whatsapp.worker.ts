import dotenv from "dotenv";
dotenv.config();

import { Worker } from "bullmq";
import { WhatsAppLog } from "../logs/whatsappLog.model";
import { redisConnection } from "../lib/redis.connection";
import { sendWhatsAppBulkMessages as sendWhatsAppMessage } from "../../../../shared/whatsapp/templates/whatsappTemplate.service";
import { recordOutboundTemplateMessage } from "../../../../shared/whatsapp/inbox/whatsappInbox.service";
import { connectDB } from "../config/db";

interface WhatsAppJobData {
  to: string;
  templateName: string;
  variables: string[];
  recordId?: string;
  logId?: string;
  campaignId?: string;
}

const startWorker = async () => {
  try {
    // ✅ CONNECT DB (MOST IMPORTANT)
    await connectDB();
    console.log("✅ MongoDB connected in WhatsApp worker");

    new Worker<WhatsAppJobData>(
      "whatsapp-queue",
      async (job) => {
        console.log("━━━━━━━━━━━━━━━━━━━━━━━");
        console.log("📦 Processing job:", job.id);
        console.log("📱 Phone:", job.data.to);
        console.log("🧾 logId:", job.data.logId);

        // 🔍 CHECK LOG EXISTS
        if (job.data.logId) {
          const existing = await WhatsAppLog.findById(job.data.logId);
          console.log("🔍 Existing log:", existing);

          if (!existing) {
            console.log("❌ LOG NOT FOUND IN DB");
          }

          // 🛑 prevent duplicate send
          if (existing?.status === "success") {
            console.log("⚠️ Already sent, skipping:", job.data.to);
            return;
          }
        } else {
          console.log("❌ logId is missing!");
        }

        try {
          // 🔥 SEND MESSAGE
          const response = await sendWhatsAppMessage({
            to: job.data.to,
            templateName: job.data.templateName,
            variables: job.data.variables,
          });

          console.log("📬 Meta response:", response?.data);
          console.log("✅ WhatsApp sent:", job.data.to);

          // ✅ UPDATE LOG SUCCESS
          if (job.data.logId) {
            try {
              const updated = await WhatsAppLog.findByIdAndUpdate(
                job.data.logId,
                {
                  status: "success",
                  response: response?.data,
                },
                { new: true }
              );

              console.log("✅ Updated log:", updated);

              await recordOutboundTemplateMessage({
                to: job.data.to,
                templateName: job.data.templateName,
                status: "sent",
                logId: job.data.logId,
                response: response?.data,
              }).catch((inboxErr) => {
                console.error("⚠️ Inbox record error:", inboxErr);
              });

              if (!updated) {
                console.log("❌ UPDATE FAILED → log not found");
              }
            } catch (dbError) {
              console.error("⚠️ DB update error:", dbError);
            }
          }
        } catch (err: any) {
          console.error("❌ WhatsApp failed:", err?.message);

          // ❌ UPDATE LOG FAILED
          if (job.data.logId) {
            await WhatsAppLog.findByIdAndUpdate(job.data.logId, {
              status: "failed",
              error: err?.response?.data || err.message,
            });
          }

          throw err; // 🔥 required for retry
        }
      },
      {
        connection: redisConnection,
        concurrency: 3, // reduce for stability
      }
    );
  } catch (err) {
    console.error("❌ Worker startup failed:", err);
    process.exit(1);
  }
};

startWorker();