import { Request, Response } from "express";
import {
  getSearchResultSchedule,
  runSearchResultEmailJob,
  scheduleSearchResultSend,
} from "../jobs/searchResultEmail.job";

export async function getSearchResultEmailSchedule(_req: Request, res: Response) {
  return res.json({ success: true, data: getSearchResultSchedule() });
}

export async function saveSearchResultEmailSchedule(req: Request, res: Response) {
  try {
    const data = await scheduleSearchResultSend({
      repeat: req.body?.repeat,
      scheduleAt: req.body?.scheduleAt,
      hour: req.body?.hour,
      minute: req.body?.minute,
      weekday: req.body?.weekday,
      dayOfMonth: req.body?.dayOfMonth,
    });
    return res.json({
      success: true,
      data,
      message: `${data.label} IST. ${data.summary}`,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Invalid time",
    });
  }
}

export async function sendSearchResultEmailsNow(_req: Request, res: Response) {
  try {
    const result = await runSearchResultEmailJob();
    const message = result.alreadyRunning
      ? "A send is already running. Wait for it to finish."
      : result.sent > 0
        ? `Sent ${result.sent} email${result.sent === 1 ? "" : "s"}.`
        : "No new emails. People who already received today's mail were skipped.";
    return res.json({ success: true, data: result, message });
  } catch (error) {
    console.error("[search-email] Manual send failed:", error instanceof Error ? error.message : error);
    return res.status(500).json({
      success: false,
      message: "The search emails could not be sent.",
    });
  }
}
