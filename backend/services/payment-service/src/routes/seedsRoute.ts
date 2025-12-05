import plan from "../models/planModel";
import { plans } from "../seeds/plan_seeds";

export const seedPlans = async () => {
  const created = [];
  const updated = [];

  for (const p of plans) {
    const existing = await plan.findOne({ planId: p.planId });

    if (existing) {
      // Update existing plan
      await plan.updateOne({ planId: p.planId }, { $set: p });
      updated.push(p.planId);
    } else {
      // Create new plan
      await plan.create(p);
      created.push(p.planId);
    }
  }

  return { created, updated };
};
