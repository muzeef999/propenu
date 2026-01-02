import { Request, Response } from "express";
import { Plan } from "../models/planModel";

export async function getPlans(req: Request, res: Response) {
  const { userType, category } = req.query;

  const filter: any = {};
  if (userType) filter.userType = userType;
  if (category) filter.category = category;

  const plans = await Plan.find(filter).sort({ price: 1 });
  res.json(plans);
}
