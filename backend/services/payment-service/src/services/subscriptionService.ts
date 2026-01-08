import { Subscription } from "../models/subscriptionModel";
import { Plan } from "../models/planModel";

export async function activateSubscription(userId: string, planCode: string) {
  const plan = await Plan.findOne({ code: planCode }).lean();
  if (!plan) throw new Error("Plan not found");

  // 🔥 expire only SAME type plan
  const expireFilter: any = {
    userId,
    userType: plan.userType,
    status: "active",
  };

  if (plan.category) {
    expireFilter.category = plan.category;
  }

  await Subscription.updateMany(expireFilter, { status: "expired" });

  const payload: any = {
    userId,
    userType: plan.userType,
    planCode: plan.code,
    tier: plan.tier,
    status: "active",
    startDate: new Date(),
    endDate: new Date(Date.now() + plan.durationDays * 86400000),
    usage: { contactUsed: 0, enquiryUsed: 0 },
  };

  if (plan.category) {
    payload.category = plan.category;
  }

  return Subscription.create(payload);
}
