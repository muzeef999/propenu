import { Router, Request, Response } from "express";
import { whatsappQueue } from "../queues/whatsapp.queue";
import { WhatsAppLog } from "./whatsappLog.model";
const router = Router();

/**
 * 🔥 GLOBAL STATS
 */
router.get("/stats", async (_req: Request, res: Response) => {
  try {
    const total = await WhatsAppLog.countDocuments();

    const success = await WhatsAppLog.countDocuments({ status: "success" });
    const failed = await WhatsAppLog.countDocuments({ status: "failed" });
    const pending = await WhatsAppLog.countDocuments({ status: "pending" });

    res.json({
      total,
      success,
      failed,
      pending,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});



/**
 * 🔥 GET ALL LOGS
 */
router.get("/", async (_req: Request, res: Response) => {
  try {
    const logs = await WhatsAppLog.find().sort({ createdAt: -1 }).limit(100);

    res.json(logs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});


/**
 * 🔥 CAMPAIGN STATS
 */
router.get("/campaign/:campaignId", async (req: Request, res: Response) => {
  try {
    const campaignId = req.params.campaignId as string;
    if (!campaignId) {
      return res.status(400).json({ message: "campaignId required" });
    }

    const total = await WhatsAppLog.countDocuments({ campaignId });

    const success = await WhatsAppLog.countDocuments({
      campaignId,
      status: "success",
    });

    const failed = await WhatsAppLog.countDocuments({
      campaignId,
      status: "failed",
    });

    const pending = await WhatsAppLog.countDocuments({
      campaignId,
      status: "pending",
    });

    res.json({
      campaignId,
      total,
      success,
      failed,
      pending,
      progress: `${success}/${total}`,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});


/**
 * 🔥 RETRY FAILED WHATSAPP
 */
router.post(
  "/retry-failed/:campaignId",
  async (req: Request, res: Response) => {
    try {
      const campaignId = req.params.campaignId as string;

      if (!campaignId) {
        return res.status(400).json({ message: "campaignId required" });
      }

      // Stuck campaigns are still "pending" (worker never sent them).
      // Retry those as well as Meta failures.
      const retryLogs = await WhatsAppLog.find({
        campaignId,
        status: { $in: ["failed", "pending"] },
      });

      let retried = 0;

      for (const log of retryLogs) {
        const to = log.to;
        const templateName = log.templateName;
        const variables = Array.isArray((log as any).variables)
          ? (log as any).variables
          : [];

        if (!to || !templateName) {
          console.log("⚠️ Skipping invalid log:", log._id);
          continue;
        }

        await whatsappQueue.add("send-message", {
          to,
          templateName,
          variables,
          language: (log as any).language,
          headerImageUrl: (log as any).headerImageUrl,
          logId: String(log._id),
          campaignId,
        });

        log.status = "pending";
        log.error = undefined;
        await log.save();

        retried++;
      }

      res.json({
        message: "Retry started",
        retried,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },
);

export default router;
