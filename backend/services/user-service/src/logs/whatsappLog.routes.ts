import { Router, Request, Response } from "express";
import { WhatsAppLog } from "./whatsappLog.model.js";
import { whatsappQueue } from "../queues/whatsapp.queue.js";

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

      const failedLogs = await WhatsAppLog.find({
        campaignId,
        status: "failed",
      });

      let retried = 0;

      for (const log of failedLogs) {
        const to = log.to;
        const templateName = log.templateName;

        // ⚠️ variables not stored → skip if missing
        // 👉 BEST: store variables in DB (future improvement)

        if (!to || !templateName) {
          console.log("⚠️ Skipping invalid log:", log._id);
          continue;
        }

        // ⚠️ fallback empty variables (or store in DB)
        await whatsappQueue.add("send-message", {
          to,
          templateName,
          variables: [], // ⚠️ improve later
          logId: String(log._id),
          campaignId,
        });

        log.status = "pending";
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
