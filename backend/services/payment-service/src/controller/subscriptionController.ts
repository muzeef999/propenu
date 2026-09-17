import { Response } from "express";
import { AuthRequest } from "../middlewares/authMiddleware";
import { Subscription } from "../models/subscriptionModel";
import { Plan } from "../models/planModel";
import Residential from "../models/residentialModel";
import Commercial from "../models/commercialModel";
import LandPlot from "../models/landModel";
import Agricultural from "../models/agriculturalModel";
import { SubscriptionHistory } from "../models/subscriptionHistoryModel";

export async function getMySubscription(req: AuthRequest, res: Response) {
  
  let userId = req.user!.id;

  if (req.user?.roleName === "super_admin" && req.query.userId) {
    userId = req.query.userId as string;
  }

  const subscriptions = await Subscription.find({
    userId,
    status: "active",
  }).lean();

  if (!subscriptions.length) {
    return res.json({ active: false, plans: [] });
  }

  const planCodes = subscriptions.map((s) => s.planCode);
  const plans = await Plan.find({ code: { $in: planCodes } }).lean();
  const planMap = new Map(plans.map((p) => [p.code, p]));

  // ✅ count properties ONCE
  const [sellCount, rentCount] = await Promise.all([
    Promise.all([
      Residential.countDocuments({ createdBy: userId, listingType: "sale", status: "active" }),
      Commercial.countDocuments({ createdBy: userId, listingType: "sale", status: "active" }),
      LandPlot.countDocuments({ createdBy: userId, listingType: "sale", status: "active" }),
      Agricultural.countDocuments({ createdBy: userId, listingType: "sale", status: "active" }),
    ]).then((r) => r.reduce((a, b) => a + b, 0)),

    Promise.all([
      Residential.countDocuments({ createdBy: userId, listingType: "rent", status: "active" }),
      Commercial.countDocuments({ createdBy: userId, listingType: "rent", status: "active" }),
      LandPlot.countDocuments({ createdBy: userId, listingType: "rent", status: "active" }),
      Agricultural.countDocuments({ createdBy: userId, listingType: "rent", status: "active" }),
    ]).then((r) => r.reduce((a, b) => a + b, 0)),
  ]);

  const result = subscriptions.map((sub) => {
    const plan: any = planMap.get(sub.planCode);
    if (!plan) return null;

    const getFeature = (key: string) => {
      if (typeof plan.features?.get === "function") {
        return plan.features.get(key);
      }
      return plan.features?.[key];
    };

    // 🏠 PROPERTY LIMIT
    const rawPropertyLimit =
      getFeature("PROPERTY_LISTING_LIMIT") ??
      getFeature("propertyListingLimit") ??
      getFeature("property_listing_limit") ??
      getFeature("listingLimit");

    const parsedProperty =
      rawPropertyLimit !== undefined && rawPropertyLimit !== null && rawPropertyLimit !== ""
        ? Number(rawPropertyLimit)
        : NaN;

    const propertyLimit =
      (plan.userType === "owner" || plan.userType === "agent") && !isNaN(parsedProperty)
        ? parsedProperty
        : undefined;

    let propertyUsed = 0;
    if (propertyLimit !== undefined) {
      if (plan.userType === "owner") {
        propertyUsed = sub.category === "sell" ? sellCount : rentCount;
      } else if (plan.userType === "agent") {
        propertyUsed = sellCount + rentCount;
      }
    }

    // 👤 CONTACT LIMIT
    const rawContactLimit =
      (sub as any).usage?.contactLimit ??
      getFeature("CONTACT_OWNER_LIMIT") ??
      getFeature("CONTACT_LIMIT") ??
      getFeature("contactLimit") ??
      getFeature("contact_limit") ??
      getFeature("contactOwnerLimit");

    const parsedContact =
      rawContactLimit !== undefined && rawContactLimit !== null && rawContactLimit !== ""
        ? Number(rawContactLimit)
        : NaN;

    const contactLimit = !isNaN(parsedContact) ? parsedContact : undefined;
    const contactUsed = Number((sub as any).usage?.contactUsed || 0);

    const propertyUsage =
      propertyLimit !== undefined
        ? {
            total: propertyLimit,
            used: propertyUsed,
            remaining: Math.max(propertyLimit - propertyUsed, 0),
          }
        : undefined;

    const contactUsage =
      contactLimit !== undefined
        ? {
            total: contactLimit,
            used: contactUsed,
            remaining: Math.max(contactLimit - contactUsed, 0),
          }
        : undefined;

    // Fallback single metric for backward compatibility (pure buyers / pure owners)
    let total = 0;
    let used = 0;
    let unit: "properties" | "contacts" = "properties";

    if (propertyLimit !== undefined) {
      total = propertyLimit;
      used = propertyUsed;
      unit = "properties";
    } else if (contactLimit !== undefined) {
      total = contactLimit;
      used = contactUsed;
      unit = "contacts";
    }

    return {
      userType: sub.userType,
      category: sub.category,
      code: sub.planCode,
      tier: sub.tier,
      planName: plan.name || plan.title || sub.planCode,
      total,
      used,
      remaining: Math.max(total - used, 0),
      unit,
      propertyUsage,
      contactUsage,
      startDate: sub.startDate,
      endDate: sub.endDate,
    };
  });

  res.json({
    active: true,
    plans: result.filter(Boolean),
  });
}

export async function getSubscriptionHistory(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;

    const history = await SubscriptionHistory.find({ userId })
      .sort({ purchasedAt: -1 })
      .lean();

    if (!history.length) {
      return res.json({
        success: true,
        history: [],
      });
    }

    const planCodes = [...new Set(history.map((h) => h.planCode))];
    const plans = await Plan.find({ code: { $in: planCodes } }).lean();
    const planMap = new Map(plans.map((p) => [p.code, p]));

    // 3️⃣ Shape response for UI
    const result = history.map((item) => {
      const plan: any = planMap.get(item.planCode);

      return {
        planCode: item.planCode,
        planName: plan?.name || item.planCode,
        tier: item.tier,
        category: item.category,
        price: item.price,
        status: item.status, // active | expired | cancelled
        startDate: item.startDate,
        endDate: item.endDate,
        purchasedAt: item.purchasedAt,
        invoiceUrl: item.invoiceUrl,
      };
    });

    res.json({
      success: true,
      history: result,
    });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Unable to fetch subscription history",
      });
  }
}
