import { Router, Request, Response } from "express";
import { EmailLog } from "./emailLog.model.js";
import { emailQueue } from "../queues/email.queue.js";

const router = Router();

/**
 * 🔥 GLOBAL STATS
 */
router.get("/stats", async (_req: Request, res: Response) => {
  try {
    const total = await EmailLog.countDocuments();

    const success = await EmailLog.countDocuments({ status: "success" });
    const failed = await EmailLog.countDocuments({ status: "failed" });
    const pending = await EmailLog.countDocuments({ status: "pending" });

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

router.get("/campaigns", async (_req: Request, res: Response) => {
  try {
    const campaigns = await EmailLog.aggregate([
      {
        $group: {
          _id: "$campaignId",

          total: { $sum: 1 },

          success: {
            $sum: {
              $cond: [{ $eq: ["$status", "success"] }, 1, 0],
            },
          },

          failed: {
            $sum: {
              $cond: [{ $eq: ["$status", "failed"] }, 1, 0],
            },
          },

          pending: {
            $sum: {
              $cond: [{ $eq: ["$status", "pending"] }, 1, 0],
            },
          },
        },
      },

      // 🔥 Format output
      {
        $project: {
          _id: 0,
          campaignId: "$_id",
          total: 1,
          success: 1,
          failed: 1,
          pending: 1,
          progress: {
            $concat: [
              { $toString: "$success" },
              "/",
              { $toString: "$total" },
            ],
          },
        },
      },

      // 🔥 Sort latest first (optional)
      {
        $sort: { campaignId: -1 },
      },
    ]);

    res.json(campaigns);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});


router.get("/campaign-running", async (_req: Request, res: Response) => {
  try {
    const campaigns = await EmailLog.aggregate([
      {
        $group: {
          _id: "$campaignId",

          total: { $sum: 1 },

          success: {
            $sum: {
              $cond: [{ $eq: ["$status", "success"] }, 1, 0],
            },
          },

          failed: {
            $sum: {
              $cond: [{ $eq: ["$status", "failed"] }, 1, 0],
            },
          },

          pending: {
            $sum: {
              $cond: [{ $eq: ["$status", "pending"] }, 1, 0],
            },
          },

          latest: { $max: "$createdAt" }, // 🔥 latest campaign
        },
      },

      // 🔥 ONLY RUNNING
      {
        $match: {
          pending: { $gt: 0 },
        },
      },

      // 🔥 LATEST FIRST
      {
        $sort: { latest: -1 },
      },

      // 🔥 ONLY ONE (current running)
      {
        $limit: 1,
      },

      // 🔥 FORMAT
      {
        $project: {
          _id: 0,
          campaignId: "$_id",
          total: 1,
          success: 1,
          failed: 1,
          pending: 1,
          progress: {
            $concat: [
              { $toString: "$success" },
              "/",
              { $toString: "$total" },
            ],
          },
        },
      },
    ]);

    res.json(campaigns[0] || null);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * 🔥 CAMPAIGN STATS (FIXED ✅)
 */
router.get("/campaign/:campaignId", async (req: Request, res: Response) => {
  try {
    // ✅ FIX: safe extraction
    const campaignId = req.params.campaignId as string;

    if (!campaignId) {
      return res.status(400).json({ message: "campaignId required" });
    }

    const total = await EmailLog.countDocuments({ campaignId });

    const success = await EmailLog.countDocuments({
      campaignId,
      status: "success",
    });

    const failed = await EmailLog.countDocuments({
      campaignId,
      status: "failed",
    });

    const pending = await EmailLog.countDocuments({
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
 * 🔥 GET ALL LOGS (TABLE VIEW)
 */
router.get("/", async (_req: Request, res: Response) => {
  try {
    const logs = await EmailLog.find()
      .sort({ createdAt: -1 })
      .limit(100);

    res.json(logs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});



router.post("/retry-failed/:campaignId", async (req, res) => {
  try {
    const { campaignId } = req.params;

    const failedLogs = await EmailLog.find({
      campaignId,
      status: "failed",
    });

    let retried = 0;

    for (const log of failedLogs) {
  // ✅ SAFE EXTRACTION
  const to = log.to as string | undefined;
  const subject = log.subject as string | undefined;
  const html = (log as any).html as string | undefined;

  // ✅ VALIDATION (IMPORTANT)
  if (!to || !subject || !html) {
    console.log("⚠️ Skipping invalid log:", log._id);
    continue;
  }

  await emailQueue.add("send-email", {
    to,
    subject,
    html,
    logId: String(log._id),
    campaignId,
  });

  log.status = "pending";
  await log.save();
}

    res.json({
      message: "Retry started",
      retried,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;