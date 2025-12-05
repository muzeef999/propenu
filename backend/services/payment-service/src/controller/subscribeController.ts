import { Request, Response } from "express";
import * as subscriptionService from "../services/subscriptionService.js";

export async function subscribe(req: Request, res: Response) {
  try {
    const { userId, planId, months } = req.body;
    if (!userId || !planId) return res.status(400).json({ message: "userId and planId required" });

    const result = await subscriptionService.createOrder({ userId, planId, months });
    return res.json({ success: true, data: result });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ message: err.message ?? "Server error" });
  }
}
