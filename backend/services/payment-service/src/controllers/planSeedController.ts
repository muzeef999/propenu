import { Request, Response } from "express";
import { Plan } from "../models/planModel";
import { plans } from "../seed/plansSeed";

export async function seedPlans(req: Request, res: Response) {
  try {
    let count = 0;

    for (const plan of plans) {
      await Plan.updateOne(
        { code: plan.code },
        { $set: plan },
        { upsert: true }
      );
      count++;
    }

    return res.status(201).json({
      message: "Plans seeded successfully",
      count,
    });
  } catch (error: any) {
    return res.status(500).json({
      message: "Failed to seed plans",
      error: error.message,
    });
  }
}
