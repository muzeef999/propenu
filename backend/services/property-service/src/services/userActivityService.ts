import mongoose from "mongoose";
import UserActivity, {
  USER_ACTIVITY_MAX_ACTIONS,
  USER_ACTIVITY_PAGE_SIZE,
} from "../models/userActivityModel";
import UserInteraction from "../models/userInteractionModel";

const NOISE_EVENTS = new Set(["session_heartbeat", "page_exit"]);

const ACTION_GROUPS: Record<string, string[]> = {
  browsing: [
    "page_view",
    "page_exit",
    "session_heartbeat",
    "listing_impression",
    "featured_project_impression",
  ],
  searches: ["search_performed", "filter_applied", "search_result_click"],
  views: [
    "project_view",
    "property_view",
    "plot_view",
    "project_click",
    "property_click",
    "featured_project_click",
  ],
  gallery: ["gallery_open", "gallery_image_view", "map_open", "price_calculator_used"],
  shortlists: ["shortlist_added", "shortlist_removed", "compare_added"],
  brochures: ["brochure_downloaded"],
  contacts: [
    "whatsapp_clicked",
    "phone_clicked",
    "contact_owner_clicked",
    "lead_form_started",
    "lead_form_abandoned",
    "otp_requested",
    "otp_verification_failed",
  ],
  visits: ["site_visit_submitted", "booking_started"],
};

export const actionGroupFor = (eventType: string) => {
  for (const [group, types] of Object.entries(ACTION_GROUPS)) {
    if (types.includes(eventType)) return group;
  }
  return "other";
};

const istDayKey = (value = new Date()) =>
  value.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

const toObjectId = (userId: string) => new mongoose.Types.ObjectId(userId);

export const appendUserAction = async (
  userId: string,
  action: Record<string, unknown>,
) => {
  const uid = toObjectId(userId);
  const eventType = String(action.eventType || "");
  const pageUrl = String(action.pageUrl || "");
  const sessionId = String(action.sessionId || "");
  const at = (action.serverTimestamp as Date) || new Date();
  const group = actionGroupFor(eventType);
  const day = istDayKey(at);

  const existing = await UserActivity.findOne({ userId: uid })
    .select("lastAction lastEventAt lastSessionId")
    .lean();
  const last = existing?.lastAction as any;
  if (
    last &&
    String(last.eventType) === eventType &&
    String(last.pageUrl || "") === pageUrl &&
    String(last.sessionId || "") === sessionId &&
    existing?.lastEventAt &&
    at.getTime() - new Date(existing.lastEventAt).getTime() < 2_000
  ) {
    return { duplicate: true, actionId: String(last._id || "") };
  }

  const shouldStoreAction = !NOISE_EVENTS.has(eventType);
  const update: Record<string, unknown> = {
    $setOnInsert: { userId: uid },
    $set: {
      lastEventAt: at,
      lastEventType: eventType,
      lastPageUrl: pageUrl,
      lastSessionId: sessionId,
      lastAction: shouldStoreAction ? action : existing?.lastAction,
    },
    $inc: {
      eventCount: shouldStoreAction ? 1 : 0,
      [`counters.${group}`]: shouldStoreAction ? 1 : 0,
      [`daily.${day}.actions`]: shouldStoreAction ? 1 : 0,
      [`daily.${day}.${group}`]: shouldStoreAction ? 1 : 0,
    },
  };
  if (shouldStoreAction) {
    update.$push = {
      actions: {
        $each: [action],
        $position: 0,
        $slice: USER_ACTIVITY_MAX_ACTIONS,
      },
    };
  }

  const doc = await UserActivity.findOneAndUpdate({ userId: uid }, update, {
    upsert: true,
    new: true,
    setDefaultsOnInsert: true,
  }).select("_id lastAction eventCount");

  return {
    duplicate: false,
    actionId: String((doc?.lastAction as any)?._id || doc?._id || ""),
    eventCount: Number(doc?.eventCount || 0),
  };
};

const mapLegacyEvent = (event: any) => ({
  sessionId: event.sessionId,
  eventType: event.eventType,
  eventCategory: event.eventCategory,
  entityType: event.entityType,
  projectId: event.projectId,
  propertyId: event.propertyId,
  plotId: event.plotId,
  promotionType: event.promotionType,
  promotionId: event.promotionId,
  source: event.source,
  pageUrl: event.pageUrl,
  previousPageUrl: event.previousPageUrl,
  metadata: event.metadata,
  searchContext: event.searchContext,
  clientTimestamp: event.clientTimestamp,
  serverTimestamp: event.serverTimestamp,
});

/** One-time fill from the old per-event collection so history is not lost. */
export const hydrateUserActivity = async (userId: string) => {
  const uid = toObjectId(userId);
  const existing = await UserActivity.findOne({ userId: uid }).lean();
  if (existing?.actions?.length) return existing;

  const events = await UserInteraction.find({ userId: uid })
    .sort({ serverTimestamp: -1 })
    .limit(USER_ACTIVITY_MAX_ACTIONS)
    .lean();
  if (!events.length) return existing || null;

  const actions = events
    .filter((event) => !NOISE_EVENTS.has(String(event.eventType)))
    .map(mapLegacyEvent);
  const last = actions[0];
  const counters: Record<string, number> = {};
  const daily: Record<string, Record<string, number>> = {};
  for (const action of actions) {
    const group = actionGroupFor(String(action.eventType));
    counters[group] = (counters[group] || 0) + 1;
    const day = istDayKey(new Date(action.serverTimestamp));
    const bucket = (daily[day] ||= { actions: 0 });
    bucket.actions = (bucket.actions || 0) + 1;
    bucket[group] = (bucket[group] || 0) + 1;
  }

  const doc = await UserActivity.findOneAndUpdate(
    { userId: uid },
    {
      $setOnInsert: { userId: uid },
      $set: {
        actions,
        eventCount: actions.length,
        lastEventAt: last?.serverTimestamp,
        lastEventType: last?.eventType,
        lastPageUrl: last?.pageUrl,
        lastSessionId: last?.sessionId,
        lastAction: last,
        counters,
        daily,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  ).lean();
  return doc;
};

export const listUserActions = async (
  userId: string,
  options: {
    since?: Date;
    until?: Date;
    page?: number;
    limit?: number;
    sessionId?: string;
    includeNoise?: boolean;
  } = {},
) => {
  const limit = Math.min(
    USER_ACTIVITY_PAGE_SIZE,
    Math.max(1, Number(options.limit) || USER_ACTIVITY_PAGE_SIZE),
  );
  const doc = await hydrateUserActivity(userId);
  const raw = Array.isArray(doc?.actions) ? doc.actions : [];
  const sinceMs = options.since ? options.since.getTime() : 0;
  const untilMs = options.until ? options.until.getTime() : Number.POSITIVE_INFINITY;
  const filtered = raw.filter((action: any) => {
    if (!options.includeNoise && NOISE_EVENTS.has(String(action.eventType))) return false;
    if (options.sessionId && String(action.sessionId) !== options.sessionId) return false;
    const t = new Date(action.serverTimestamp || 0).getTime();
    return t >= sinceMs && t <= untilMs;
  });
  const total = filtered.length;
  const pages = Math.max(1, Math.ceil(total / limit) || 1);
  const page = Math.min(pages, Math.max(1, Number(options.page) || 1));
  const skip = (page - 1) * limit;
  const items = filtered.slice(skip, skip + limit);
  return {
    doc,
    items,
    pagination: {
      page,
      pageSize: limit,
      total,
      totalPages: pages,
      rangeStart: total === 0 ? 0 : skip + 1,
      rangeEnd: Math.min(skip + items.length, total),
      hasNextPage: page < pages,
      hasPreviousPage: page > 1,
    },
  };
};
