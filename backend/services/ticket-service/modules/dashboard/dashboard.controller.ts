import type { Request, Response } from "express";
import { DashboardService } from "./dashboard.service";

export const getDashboardOverview = async (req: Request, res: Response) => {
  try {
    return res.json({ success: true, data: await DashboardService.overview(req.query) });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message || "Internal server error" });
  }
};

export const getTicketTrends = async (req: Request, res: Response) => {
  try {
    return res.json({ success: true, data: await DashboardService.trends(req.query) });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message || "Internal server error" });
  }
};

export const getAgentPerformance = async (req: Request, res: Response) => {
  try {
    return res.json({ success: true, data: await DashboardService.agentPerformance(req.query) });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message || "Internal server error" });
  }
};

