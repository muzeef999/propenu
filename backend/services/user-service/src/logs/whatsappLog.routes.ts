import { Router, Request, Response } from "express";
import { whatsappQueue } from "../queues/whatsapp.queue";
import { WhatsAppLog } from "./whatsappLog.model";
import { WhatsAppCampaignRun } from "./whatsappCampaignRun.model";

const router = Router();

/** Attempted (sent + failed) / total. Pending includes anything not yet logged. */
function campaignProgress(
  totalRaw: number,
  successRaw: number,
  failedRaw: number,
  pendingRaw: number,
  expectedRaw?: number,
) {
  const success = Number(successRaw || 0);
  const failed = Number(failedRaw || 0);
  const pending = Number(pendingRaw || 0);
  const known = success + failed + pending;
  const total = Math.max(Number(totalRaw || 0), Number(expectedRaw || 0), known);
  const pendingAll = pending + Math.max(0, total - known);
  const processed = success + failed;
  const progressPercent = total ? Math.round((processed / total) * 100) : 0;
  return {
    total,
    success,
    sent: success,
    delivered: success,
    failed,
    pending: pendingAll,
    processed,
    progress: `${processed}/${total}`,
    progressPercent,
  };
}

/**
 * GLOBAL STATS — single aggregation (pending | success | failed only).
 */
router.get("/stats", async (_req: Request, res: Response) => {
  try {
    const [row] = await WhatsAppLog.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          success: {
            $sum: { $cond: [{ $eq: ["$status", "success"] }, 1, 0] },
          },
          failed: {
            $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] },
          },
          pending: {
            $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
          },
        },
      },
    ]);

    const total = Number(row?.total || 0);
    const success = Number(row?.success || 0);
    const failed = Number(row?.failed || 0);
    const pending = Number(row?.pending || 0);

    res.json({
      total,
      success,
      failed,
      pending,
      // Aliases kept for older clients — never invent a separate "delivered"
      delivered: success,
      warning: pending,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * ALL LOGS (newest first)
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const limitRaw = Number(req.query.limit);
    const limit = Number.isFinite(limitRaw)
      ? Math.min(Math.max(limitRaw, 1), 2000)
      : 500;

    const logs = await WhatsAppLog.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    res.json(logs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * CAMPAIGN LIST — accurate aggregates from all logs + run ledger
 */
router.get("/campaigns", async (_req: Request, res: Response) => {
  try {
    const [grouped, runs] = await Promise.all([
      WhatsAppLog.aggregate([
        {
          $match: {
            campaignId: { $exists: true, $nin: [null, ""] },
          },
        },
        {
          $group: {
            _id: "$campaignId",
            total: { $sum: 1 },
            success: {
              $sum: { $cond: [{ $eq: ["$status", "success"] }, 1, 0] },
            },
            failed: {
              $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] },
            },
            pending: {
              $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
            },
            templateName: { $first: "$templateName" },
            category: { $first: "$category" },
            language: { $first: "$language" },
            createdAt: { $max: "$createdAt" },
            errors: {
              $push: {
                $cond: [
                  { $eq: ["$status", "failed"] },
                  { to: "$to", error: "$error" },
                  "$$REMOVE",
                ],
              },
            },
          },
        },
        { $sort: { createdAt: -1 } },
        { $limit: 500 },
      ]),
      WhatsAppCampaignRun.find()
        .sort({ createdAt: -1 })
        .limit(500)
        .lean(),
    ]);

    const byId = new Map<string, any>();

    for (const g of grouped) {
      const campaignId = String(g._id || "").trim();
      if (!campaignId) continue;
      const errors = Array.isArray(g.errors) ? g.errors.filter(Boolean) : [];
      byId.set(campaignId, {
        campaignId,
        name: g.templateName || campaignId,
        category: String(g.category || "MARKETING").toUpperCase(),
        language: g.language || "en",
        createdAt: g.createdAt,
        total: Number(g.total || 0),
        delivered: Number(g.success || 0),
        success: Number(g.success || 0),
        failed: Number(g.failed || 0),
        pending: Number(g.pending || 0),
        failureReason: errors[0]?.error || "",
        failedSamples: errors.slice(0, 5).map((e: any) => ({
          to: e?.to,
          error: e?.error || "Unknown Meta send error",
        })),
        runStatus: null,
        estimatedRecipients: Number(g.total || 0),
        queued: Number(g.total || 0),
        skipped: 0,
        source: null,
      });
    }

    for (const run of runs) {
      const campaignId = String(run.campaignId || "").trim();
      if (!campaignId) continue;
      const existing = byId.get(campaignId);
      if (existing) {
        existing.runStatus = run.status || null;
        existing.estimatedRecipients =
          run.estimatedRecipients ?? existing.estimatedRecipients;
        existing.queued = run.queued ?? existing.queued;
        existing.skipped = run.skipped ?? 0;
        existing.source = run.source || null;
        if (run.templateName) existing.name = run.templateName;
        if (run.error && !existing.failureReason) {
          existing.failureReason = run.error;
        }
        if (
          run.createdAt &&
          (!existing.createdAt ||
            new Date(run.createdAt) > new Date(existing.createdAt))
        ) {
          // Prefer earliest campaign start for display when available
        }
        if (run.createdAt && !existing.createdAt) {
          existing.createdAt = run.createdAt;
        }
      } else {
        byId.set(campaignId, {
          campaignId,
          name: run.templateName || campaignId,
          category: "MARKETING",
          language: "en",
          createdAt: run.createdAt,
          total: Number(run.queued || run.estimatedRecipients || 0),
          delivered: 0,
          success: 0,
          failed: run.status === "failed" ? 1 : 0,
          pending:
            run.status === "failed"
              ? 0
              : Number(run.queued || run.estimatedRecipients || 0),
          failureReason: run.error || "",
          failedSamples: [],
          runStatus: run.status || null,
          estimatedRecipients: run.estimatedRecipients || 0,
          queued: run.queued || 0,
          skipped: run.skipped || 0,
          source: run.source || null,
        });
      }
    }

    const campaigns = [...byId.values()]
      .map((row) => {
        const counts = campaignProgress(
          row.total,
          row.success ?? row.delivered,
          row.failed,
          row.pending,
          row.estimatedRecipients,
        );
        return {
          ...row,
          ...counts,
          estimatedRecipients: row.estimatedRecipients || counts.total,
        };
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime(),
      );

    res.json({ success: true, data: campaigns });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Latest campaign that still has pending sends.
 */
router.get("/campaign-running", async (_req: Request, res: Response) => {
  try {
    const [grouped, runs] = await Promise.all([
      WhatsAppLog.aggregate([
        { $match: { campaignId: { $exists: true, $nin: [null, ""] } } },
        {
          $group: {
            _id: "$campaignId",
            total: { $sum: 1 },
            success: {
              $sum: { $cond: [{ $eq: ["$status", "success"] }, 1, 0] },
            },
            failed: {
              $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] },
            },
            pending: {
              $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
            },
            templateName: { $first: "$templateName" },
            createdAt: { $max: "$createdAt" },
          },
        },
      ]),
      WhatsAppCampaignRun.find()
        .sort({ createdAt: -1 })
        .limit(50)
        .lean(),
    ]);

    const byId = new Map<string, any>();
    for (const g of grouped) {
      const campaignId = String(g._id || "").trim();
      if (!campaignId) continue;
      byId.set(campaignId, {
        campaignId,
        name: g.templateName || campaignId,
        createdAt: g.createdAt,
        total: Number(g.total || 0),
        success: Number(g.success || 0),
        failed: Number(g.failed || 0),
        pending: Number(g.pending || 0),
        estimatedRecipients: Number(g.total || 0),
      });
    }
    for (const run of runs) {
      const campaignId = String(run.campaignId || "").trim();
      if (!campaignId) continue;
      const existing = byId.get(campaignId);
      if (existing) {
        existing.estimatedRecipients = Math.max(
          Number(run.estimatedRecipients || 0),
          Number(run.queued || 0),
          existing.estimatedRecipients || 0,
        );
        existing.name = run.templateName || existing.name;
        existing.source = run.source || existing.source || null;
        if (run.createdAt) existing.createdAt = run.createdAt;
      } else {
        byId.set(campaignId, {
          campaignId,
          name: run.templateName || campaignId,
          createdAt: run.createdAt,
          total: 0,
          success: 0,
          failed: 0,
          pending: 0,
          estimatedRecipients: Number(
            run.estimatedRecipients || run.queued || 0,
          ),
        });
      }
    }

    const ACTIVE_MS = 45 * 60 * 1000;
    const now = Date.now();
    const recent = [...byId.values()]
      .map((row) => ({
        campaignId: row.campaignId,
        name: row.name,
        source: row.source || null,
        createdAt: row.createdAt,
        ...campaignProgress(
          row.total,
          row.success,
          row.failed,
          row.pending,
          row.estimatedRecipients,
        ),
      }))
      .filter((row) => {
        const started = new Date(row.createdAt || 0).getTime();
        return started && now - started < ACTIVE_MS;
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime(),
      );
    const running =
      recent.find((row) => row.pending > 0) || recent[0] || null;

    res.json({ success: true, data: running || null });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * CAMPAIGN STATS
 */
router.get("/campaign/:campaignId", async (req: Request, res: Response) => {
  try {
    const campaignId = req.params.campaignId as string;
    if (!campaignId) {
      return res.status(400).json({ message: "campaignId required" });
    }

    const [run, total, success, failed, pending] = await Promise.all([
      WhatsAppCampaignRun.findOne({ campaignId }).lean(),
      WhatsAppLog.countDocuments({ campaignId }),
      WhatsAppLog.countDocuments({ campaignId, status: "success" }),
      WhatsAppLog.countDocuments({ campaignId, status: "failed" }),
      WhatsAppLog.countDocuments({ campaignId, status: "pending" }),
    ]);

    const status =
      run?.status ||
      (total === 0
        ? "accepted"
        : pending > 0
          ? "sending"
          : failed === total
            ? "failed"
            : "completed");

    const counts = campaignProgress(
      total,
      success,
      failed,
      pending,
      run?.estimatedRecipients || run?.queued || total,
    );

    res.json({
      campaignId,
      status,
      run: run || null,
      name: run?.templateName || undefined,
      source: run?.source || undefined,
      createdAt: run?.createdAt || undefined,
      estimatedRecipients: run?.estimatedRecipients ?? counts.total,
      queued: run?.queued ?? total,
      skipped: run?.skipped ?? 0,
      ...counts,
      successCount: counts.success,
      error: run?.error || undefined,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * RETRY FAILED / PENDING
 */
router.post(
  "/retry-failed/:campaignId",
  async (req: Request, res: Response) => {
    try {
      const campaignId = req.params.campaignId as string;

      if (!campaignId) {
        return res.status(400).json({ message: "campaignId required" });
      }

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
          headerMediaId: (log as any).headerMediaId,
          headerFormat: (log as any).headerFormat || undefined,
          logId: String(log._id),
          campaignId,
        });

        log.status = "pending";
        log.error = null;
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
