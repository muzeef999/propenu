import crypto from "crypto";
import { Response } from "express";
import mongoose from "mongoose";
import { AuthRequest } from "../middlewares/authMiddleware";
import Agricultural from "../models/agriculturalModel";
import Commercial from "../models/commercialModel";
import FeaturedProject from "../models/featurePropertiesModel";
import LandPlot from "../models/landModel";
import Residential from "../models/residentialModel";
import UserInteraction, { INTERACTION_EVENT_TYPES, InteractionPromotionType } from "../models/userInteractionModel";
import User from "../models/userModel";

const promotionTypes = new Set(["normal", "sponsored", "featured", "prime"]);
const eventTypes = new Set<string>(INTERACTION_EVENT_TYPES);
const objectIdFields = ["projectId", "propertyId", "plotId", "promotionId"] as const;
const deduplicatedEventTypes = new Set([
  "page_view", "page_exit", "project_view", "property_view", "plot_view",
  "listing_impression", "featured_project_impression",
]);

const cleanObject = (value: unknown, maxBytes = 12_000): Record<string, unknown> | undefined => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const serialized = JSON.stringify(value);
  if (Buffer.byteLength(serialized, "utf8") > maxBytes) return undefined;
  return JSON.parse(serialized) as Record<string, unknown>;
};

const safeString = (value: unknown, max: number) =>
  typeof value === "string" && value.trim() ? value.trim().slice(0, max) : undefined;

const firstImage = (entity: any) => {
  const candidates = [entity?.projectCoverImage, entity?.coverImage, entity?.heroImage, entity?.thumbnail,
    entity?.gallery?.[0], entity?.images?.[0], entity?.galleryFiles?.[0]];
  const value = candidates.find(Boolean);
  return typeof value === "string" ? value : value?.url || value?.secure_url || value?.location || null;
};

const entitySummary = (entity: any, kind: "project" | "property", category?: string) => entity ? ({
  id: String(entity._id),
  slug: entity.slug || null,
  kind,
  category: category || entity.propertyType || entity.projectType || kind,
  title: entity.title || entity.projectName || entity.propertyName || entity.name || "Untitled listing",
  image: firstImage(entity),
  location: [entity.locality, entity.city, entity.state].filter(Boolean).join(", "),
  price: entity.price ?? entity.expectedPrice ?? entity.startingPrice ?? entity.minPrice ?? null,
  promotionType: entity.promotion?.type || entity.promotionType || "normal",
}) : null;

async function loadJourneyEntities(events: any[]) {
  const projectIds = [...new Set(events.map(event => event.projectId && String(event.projectId)).filter(Boolean))];
  const projectSlugs = [...new Set(events.map(event => {
    const match = String(event.pageUrl || "").match(/^\/(?:project|prime)\/([^/?#]+)/i);
    return match?.[1] ? decodeURIComponent(match[1]) : null;
  }).filter(Boolean))];
  const propertyIds = [...new Set(events.map(event => (event.propertyId || event.plotId) && String(event.propertyId || event.plotId)).filter(Boolean))];
  const [projects, residential, commercial, land, agricultural] = await Promise.all([
    FeaturedProject.find({ $or: [{ _id: { $in: projectIds } }, { slug: { $in: projectSlugs } }] }).lean(),
    Residential.find({ _id: { $in: propertyIds } }).lean(),
    Commercial.find({ _id: { $in: propertyIds } }).lean(),
    LandPlot.find({ _id: { $in: propertyIds } }).lean(),
    Agricultural.find({ _id: { $in: propertyIds } }).lean(),
  ]);
  return [
    ...projects.map(item => entitySummary(item, "project")),
    ...residential.map(item => entitySummary(item, "property", "residential")),
    ...commercial.map(item => entitySummary(item, "property", "commercial")),
    ...land.map(item => entitySummary(item, "property", "land")),
    ...agricultural.map(item => entitySummary(item, "property", "agricultural")),
  ].filter(Boolean);
}

async function loadOwnedListingActivity(userId: string, since: Date) {
  const filter = { createdBy: new mongoose.Types.ObjectId(userId), createdAt: { $gte: since } };
  const projection = "status isPublished approvalStatus meta createdAt";
  const groups = await Promise.all([
    FeaturedProject.find(filter).select(projection).lean(),
    Residential.find(filter).select(projection).lean(),
    Commercial.find(filter).select(projection).lean(),
    LandPlot.find(filter).select(projection).lean(),
    Agricultural.find(filter).select(projection).lean(),
  ]);
  const listings: any[] = groups.flat();
  const projectIds = groups[0].map((item: any) => item._id);
  const propertyIds = groups.slice(1).flat().map((item: any) => item._id);
  const entityFilter = {
    serverTimestamp: { $gte: since },
    $or: [
      ...(projectIds.length ? [{ projectId: { $in: projectIds } }] : []),
      ...(propertyIds.length ? [{ propertyId: { $in: propertyIds } }, { plotId: { $in: propertyIds } }] : []),
    ],
  };
  const canQueryInteractions = entityFilter.$or.length > 0;
  const [trackedViews, trackedClicks, trackedInquiries, trackedSiteVisits] = canQueryInteractions ? await Promise.all([
    UserInteraction.countDocuments({ ...entityFilter, eventType: /view|impression/i }),
    UserInteraction.countDocuments({ ...entityFilter, eventType: /click/i }),
    UserInteraction.countDocuments({ ...entityFilter, eventType: /enquir|lead|contact|whatsapp|phone|form/i }),
    UserInteraction.countDocuments({ ...entityFilter, eventType: /site_visit|visit_book/i }),
  ]) : [0, 0, 0, 0];
  const published = listings.filter(item => item.isPublished || item.status === "active" || item.approvalStatus === "approved").length;
  const storedViews = listings.reduce((sum, item) => sum + Number(item.meta?.views || 0), 0);
  const storedClicks = listings.reduce((sum, item) => sum + Number(item.meta?.clicks || 0), 0);
  const storedInquiries = listings.reduce((sum, item) => sum + Number(item.meta?.inquiries || 0), 0);
  return {
    totalPosted: listings.length,
    projectsPosted: groups[0].length,
    propertiesPosted: listings.length - groups[0].length,
    published,
    pending: listings.filter(item => item.status === "pending" || item.approvalStatus === "pending").length,
    views: Math.max(storedViews, trackedViews),
    clicks: Math.max(storedClicks, trackedClicks),
    inquiries: Math.max(storedInquiries, trackedInquiries),
    siteVisits: trackedSiteVisits,
    tracked: { views: trackedViews, clicks: trackedClicks, inquiries: trackedInquiries, siteVisits: trackedSiteVisits },
  };
}

async function resolvePromotion(entityType: unknown, projectId?: string, propertyId?: string) {
  let entity: any = null;
  if (entityType === "project" && projectId) {
    entity = await FeaturedProject.findById(projectId).select("promotion title").lean();
  } else if (entityType === "property" && propertyId) {
    const models = [Residential, Commercial, LandPlot, Agricultural];
    for (const model of models) {
      entity = await (model as any).findById(propertyId).select("promotion title propertyType").lean();
      if (entity) break;
    }
  }
  const promotion = entity?.promotion;
  const type = promotionTypes.has(promotion?.type) ? promotion.type as InteractionPromotionType : "normal";
  return {
    type,
    verified: Boolean(entity),
    snapshot: entity ? {
      type,
      priority: promotion?.priority ?? 0,
      source: promotion?.source ?? "entity",
      startedAt: promotion?.startedAt,
      expiresAt: promotion?.expiresAt,
      capturedEntityName: entity.title,
    } : undefined,
  };
}

export async function captureInteraction(req: AuthRequest, res: Response) {
  try {
    if (!req.user?.id || !mongoose.Types.ObjectId.isValid(req.user.id)) {
      return res.status(401).json({ success: false, message: "Authenticated user is required" });
    }
    const body = req.body ?? {};
    const errors: string[] = [];
    if (!safeString(body.sessionId, 128)) errors.push("sessionId is required");
    if (!eventTypes.has(body.eventType)) errors.push("eventType is invalid");
    if (!safeString(body.eventCategory, 80)) errors.push("eventCategory is required");
    if (!safeString(body.source, 120)) errors.push("source is required");
    if (!safeString(body.pageUrl, 2048)) errors.push("pageUrl is required");
    if (body.entityType && !["project", "property"].includes(body.entityType)) errors.push("entityType is invalid");
    for (const field of objectIdFields) {
      if (body[field] && !mongoose.Types.ObjectId.isValid(body[field])) errors.push(`${field} is invalid`);
    }
    const clientTimestamp = new Date(body.clientTimestamp);
    if (Number.isNaN(clientTimestamp.getTime())) errors.push("clientTimestamp is invalid");
    const metadata = cleanObject(body.metadata);
    const searchContext = cleanObject(body.searchContext);
    if (body.metadata && !metadata) errors.push("metadata must be an object smaller than 12KB");
    if (body.searchContext && !searchContext) errors.push("searchContext must be an object smaller than 12KB");
    if (errors.length) return res.status(400).json({ success: false, message: "Invalid interaction payload", errors });

    const projectId = safeString(body.projectId, 64);
    const propertyId = safeString(body.propertyId, 64);
    if (deduplicatedEventTypes.has(body.eventType)) {
      const duplicate = await UserInteraction.exists({
        userId: new mongoose.Types.ObjectId(req.user.id),
        sessionId: body.sessionId.trim(),
        eventType: body.eventType,
        pageUrl: body.pageUrl.trim(),
        ...(projectId ? { projectId: new mongoose.Types.ObjectId(projectId) } : {}),
        ...(propertyId ? { propertyId: new mongoose.Types.ObjectId(propertyId) } : {}),
        serverTimestamp: { $gte: new Date(Date.now() - 2_000) },
      });
      if (duplicate) return res.status(200).json({ success: true, duplicate: true });
    }
    const promotion = await resolvePromotion(body.entityType, projectId, propertyId);
    const requestedPromotion = promotionTypes.has(body.promotionType) ? body.promotionType : "normal";
    const forwardedFor = safeString(req.headers["x-forwarded-for"], 256)?.split(",")[0]?.trim();
    const ip = forwardedFor || req.ip;
    const ipHash = ip ? crypto.createHash("sha256").update(ip).digest("hex") : undefined;

    const interaction = await UserInteraction.create({
      userId: new mongoose.Types.ObjectId(req.user.id),
      sessionId: body.sessionId.trim(),
      ...(safeString(body.anonymousId, 128) ? { anonymousId: body.anonymousId.trim() } : {}),
      eventType: body.eventType,
      eventCategory: body.eventCategory.trim(),
      ...(body.entityType ? { entityType: body.entityType } : {}),
      ...(projectId ? { projectId: new mongoose.Types.ObjectId(projectId) } : {}),
      ...(propertyId ? { propertyId: new mongoose.Types.ObjectId(propertyId) } : {}),
      ...(body.plotId ? { plotId: new mongoose.Types.ObjectId(body.plotId) } : {}),
      promotionType: promotion.verified ? promotion.type : requestedPromotion,
      ...(body.promotionId ? { promotionId: new mongoose.Types.ObjectId(body.promotionId) } : {}),
      promotionVerified: promotion.verified && promotion.type === requestedPromotion,
      ...(promotion.snapshot ? { promotionSnapshot: promotion.snapshot } : {}),
      source: body.source.trim(),
      ...(safeString(body.placement, 120) ? { placement: body.placement.trim() } : {}),
      ...(Number.isFinite(body.position) ? { position: body.position } : {}),
      ...(safeString(body.searchId, 128) ? { searchId: body.searchId.trim() } : {}),
      ...(searchContext ? { searchContext } : {}),
      pageUrl: body.pageUrl.trim(),
      ...(safeString(body.previousPageUrl, 2048) ? { previousPageUrl: body.previousPageUrl.trim() } : {}),
      ...(metadata ? { metadata } : {}),
      clientTimestamp,
      serverTimestamp: new Date(),
      ...(safeString(req.headers["user-agent"], 512) ? { userAgent: req.headers["user-agent"] } : {}),
      ...(ipHash ? { ipHash } : {}),
    });

    return res.status(201).json({
      success: true,
      message: "Interaction captured successfully",
      data: { eventId: interaction._id, sessionId: interaction.sessionId, capturedAt: interaction.serverTimestamp, promotionType: interaction.promotionType, promotionVerified: interaction.promotionVerified },
    });
  } catch (error) {
    console.error("captureInteraction failed", error);
    return res.status(500).json({ success: false, message: "Unable to capture interaction" });
  }
}

export async function getUserJourney(req: AuthRequest, res: Response) {
  try {
    const { userId } = req.params;
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) return res.status(400).json({ success: false, message: "Invalid userId" });
    const days = Math.min(90, Math.max(1, Number(req.query.days) || 30));
    const limit = Math.min(1000, Math.max(1, Number(req.query.limit) || 500));
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const events = await UserInteraction.find({ userId, serverTimestamp: { $gte: since } }).sort({ serverTimestamp: -1 }).limit(limit).lean();
    const sessions = new Map<string, { sessionId: string; startedAt: Date; lastActiveAt: Date; eventCount: number; lastEvent: string }>();
    const sessionEvents = new Map<string, Date[]>();
    const promotions: Record<string, { impressions: number; clicks: number }> = { normal: { impressions: 0, clicks: 0 }, sponsored: { impressions: 0, clicks: 0 }, featured: { impressions: 0, clicks: 0 }, prime: { impressions: 0, clicks: 0 } };
    for (const event of [...events].reverse()) {
      const current = sessions.get(event.sessionId);
      sessions.set(event.sessionId, { sessionId: event.sessionId, startedAt: current?.startedAt ?? event.serverTimestamp, lastActiveAt: event.serverTimestamp, eventCount: (current?.eventCount ?? 0) + 1, lastEvent: event.eventType });
      sessionEvents.set(event.sessionId, [...(sessionEvents.get(event.sessionId) || []), event.serverTimestamp]);
      const bucket = promotions[event.promotionType];
      if (bucket) {
        if (event.eventType.includes("impression")) bucket.impressions += 1;
        if (event.eventType.includes("click") || event.eventType.endsWith("_view")) bucket.clicks += 1;
      }
    }
    const [entities, listingActivity] = await Promise.all([loadJourneyEntities(events), loadOwnedListingActivity(userId, since)]);
    const entityMap = new Map(entities.map((entity: any) => [entity.id, entity]));
    const entitySlugMap = new Map(entities.filter((entity: any) => entity.slug).map((entity: any) => [entity.slug, entity]));
    const enrichedEvents = events.map(event => {
      const slug = String(event.pageUrl || "").match(/^\/(?:project|prime)\/([^/?#]+)/i)?.[1];
      return { ...event, entity: entityMap.get(String(event.propertyId || event.plotId || event.projectId)) || (slug ? entitySlugMap.get(decodeURIComponent(slug)) : null) || null };
    });
    const latest = enrichedEvents[0];
    const engagedMs = [...sessionEvents.values()].reduce((total, timestamps) => {
      const ordered = timestamps.sort((a, b) => a.getTime() - b.getTime());
      return total + ordered.slice(1).reduce((sessionTotal, timestamp, index) => {
        const gap = timestamp.getTime() - ordered[index]!.getTime();
        return sessionTotal + (gap > 0 && gap <= 5 * 60_000 ? gap : 0);
      }, 0);
    }, 0);
    return res.json({ success: true, data: {
      summary: { totalEvents: events.length, totalSessions: sessions.size, projectsViewed: new Set(events.filter(e => e.projectId).map(e => String(e.projectId))).size, propertiesViewed: new Set(events.filter(e => e.propertyId).map(e => String(e.propertyId))).size, engagedMs, lastActiveAt: latest?.serverTimestamp ?? null },
      currentContext: latest ? { sessionId: latest.sessionId, eventType: latest.eventType, pageUrl: latest.pageUrl, projectId: latest.projectId, propertyId: latest.propertyId, promotionType: latest.promotionType, lastActiveAt: latest.serverTimestamp } : null,
      stoppingPoint: latest && !["session_heartbeat", "page_exit"].includes(latest.eventType) ? { eventType: latest.eventType, pageUrl: latest.pageUrl, capturedAt: latest.serverTimestamp } : null,
      promotionPerformance: promotions,
      listingActivity,
      sessions: [...sessions.values()].sort((a, b) => b.lastActiveAt.getTime() - a.lastActiveAt.getTime()),
      entities,
      events: enrichedEvents,
    }});
  } catch (error) {
    console.error("getUserJourney failed", error);
    return res.status(500).json({ success: false, message: "Unable to load user journey" });
  }
}

export async function getUserSession(req: AuthRequest, res: Response) {
  try {
    const { userId, sessionId } = req.params;
    if (!userId || !mongoose.Types.ObjectId.isValid(userId) || !sessionId) return res.status(400).json({ success: false, message: "Invalid user or session" });
    const events = await UserInteraction.find({ userId, sessionId }).sort({ serverTimestamp: 1 }).limit(2000).lean();
    return res.json({ success: true, data: { sessionId, eventCount: events.length, startedAt: events[0]?.serverTimestamp ?? null, lastActiveAt: events[events.length - 1]?.serverTimestamp ?? null, events } });
  } catch (error) {
    console.error("getUserSession failed", error);
    return res.status(500).json({ success: false, message: "Unable to load session" });
  }
}

/** Sidebar action groups for all-users activity. */
const ACTION_GROUPS: Record<string, string[]> = {
  browsing: ["page_view", "page_exit", "session_heartbeat", "listing_impression", "featured_project_impression"],
  searches: ["search_performed", "filter_applied", "search_result_click"],
  views: ["project_view", "property_view", "plot_view", "project_click", "property_click", "featured_project_click"],
  gallery: ["gallery_open", "gallery_image_view", "map_open", "price_calculator_used"],
  shortlists: ["shortlist_added", "shortlist_removed", "compare_added"],
  brochures: ["brochure_downloaded"],
  contacts: ["whatsapp_clicked", "phone_clicked", "contact_owner_clicked", "lead_form_started", "lead_form_abandoned", "otp_requested", "otp_verification_failed"],
  visits: ["site_visit_submitted", "booking_started"],
};

const NOISE_EVENTS = new Set(["session_heartbeat", "page_exit"]);

const roleLabel = (role?: string) => {
  const key = String(role || "").toLowerCase();
  if (key === "user") return "Owner";
  if (key === "builder_staff") return "Builder Staff";
  if (!key) return "User";
  return key.split("_").map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(" ");
};

const actionGroupFor = (eventType: string) => {
  for (const [group, types] of Object.entries(ACTION_GROUPS)) {
    if (types.includes(eventType)) return group;
  }
  return "other";
};

const describeWhat = (event: any, entityTitle?: string | null) => {
  const title = entityTitle || event?.promotionSnapshot?.capturedEntityName || "";
  const searchQ =
    event?.searchContext?.query ||
    event?.searchContext?.q ||
    event?.metadata?.query ||
    event?.metadata?.searchQuery ||
    "";
  switch (event.eventType) {
    case "search_performed":
      return searchQ ? `Searched “${searchQ}”` : "Searched properties";
    case "filter_applied":
      return "Applied search filters";
    case "search_result_click":
      return title ? `Opened search result · ${title}` : "Opened a search result";
    case "project_view":
    case "project_click":
    case "featured_project_click":
      return title ? `Viewed project · ${title}` : "Viewed a project";
    case "property_view":
    case "property_click":
      return title ? `Viewed property · ${title}` : "Viewed a property";
    case "plot_view":
      return title ? `Viewed plot · ${title}` : "Viewed a plot";
    case "brochure_downloaded":
      return title ? `Downloaded brochure · ${title}` : "Downloaded brochure";
    case "shortlist_added":
      return title ? `Shortlisted · ${title}` : "Added to shortlist";
    case "shortlist_removed":
      return title ? `Removed shortlist · ${title}` : "Removed from shortlist";
    case "compare_added":
      return title ? `Compared · ${title}` : "Added to compare";
    case "whatsapp_clicked":
      return title ? `WhatsApp contact · ${title}` : "Clicked WhatsApp";
    case "phone_clicked":
      return title ? `Phone contact · ${title}` : "Clicked phone";
    case "contact_owner_clicked":
      return title ? `Contacted · ${title}` : "Contacted owner/builder";
    case "lead_form_started":
      return title ? `Started lead form · ${title}` : "Started lead form";
    case "lead_form_abandoned":
      return "Abandoned lead form";
    case "otp_requested":
      return "Requested OTP";
    case "otp_verification_failed":
      return "OTP verification failed";
    case "site_visit_submitted":
      return title ? `Site visit requested · ${title}` : "Requested site visit";
    case "booking_started":
      return title ? `Booking started · ${title}` : "Started booking";
    case "gallery_open":
    case "gallery_image_view":
      return title ? `Opened gallery · ${title}` : "Opened gallery";
    case "map_open":
      return title ? `Opened map · ${title}` : "Opened map";
    case "price_calculator_used":
      return "Used price / EMI calculator";
    case "page_view": {
      const raw = String(event.pageUrl || "").trim() || "/";
      if (raw === "/" || raw === "") return "Visited home page";
      try {
        const url = raw.startsWith("http")
          ? new URL(raw)
          : new URL(raw, "https://propenu.local");
        const path = url.pathname || "/";
        const type = url.searchParams.get("type") || url.searchParams.get("propertyType");
        const listingType =
          url.searchParams.get("listingType") ||
          url.searchParams.get("purpose") ||
          url.searchParams.get("transactionType");
        const city = url.searchParams.get("city");
        const locality = url.searchParams.get("locality") || url.searchParams.get("area");
        if (path.includes("/properties") || path.includes("/search")) {
          const parts = ["Browsed"];
          if (type) parts.push(String(type).replace(/_/g, " "));
          parts.push("properties");
          if (listingType) parts.push(`for ${String(listingType).replace(/_/g, " ")}`);
          const place = locality || city;
          if (place) parts.push(`in ${place}`);
          return parts.join(" ");
        }
        if (/^\/(?:project|prime)\//i.test(path)) {
          return title ? `Viewed project details · ${title}` : "Viewed project details";
        }
        if (/account|profile|dashboard|my-/i.test(path)) return "Visited account area";
        const segment = path.split("/").filter(Boolean).pop() || "page";
        return `Visited ${segment.replace(/[-_]/g, " ")}`;
      } catch {
        return "Visited a page";
      }
    }
    case "listing_impression":
    case "featured_project_impression":
      return title ? `Saw listing · ${title}` : "Saw a listing";
    default:
      return String(event.eventType || "Activity").replace(/_/g, " ");
  }
};

const describeGot = (eventType: string, lead?: any) => {
  if (lead?._id) {
    const shortId = String(lead._id).slice(-4).toUpperCase();
    return {
      type: "lead",
      label: lead.status === "site_visit" ? "Visit booked" : `Lead #${shortId}`,
      id: String(lead._id),
    };
  }
  switch (eventType) {
    case "brochure_downloaded":
      return { type: "brochure", label: "Brochure PDF" };
    case "shortlist_added":
      return { type: "saved", label: "Saved" };
    case "shortlist_removed":
      return { type: "saved", label: "Unsaved" };
    case "site_visit_submitted":
      return { type: "visit", label: "Visit booked" };
    case "booking_started":
      return { type: "booking", label: "Booking started" };
    case "whatsapp_clicked":
    case "phone_clicked":
    case "contact_owner_clicked":
      return { type: "contact", label: "Contact started" };
    case "lead_form_started":
      return { type: "lead", label: "Lead started" };
    case "lead_form_abandoned":
      return { type: "lead", label: "Lead abandoned" };
    case "otp_requested":
      return { type: "lead", label: "OTP sent" };
    case "page_view":
    case "listing_impression":
    case "featured_project_impression":
      return { type: "browse", label: "Browsed" };
    case "project_view":
    case "property_view":
    case "plot_view":
    case "project_click":
    case "property_click":
    case "featured_project_click":
      return { type: "view", label: "Viewed" };
    case "search_performed":
    case "filter_applied":
    case "search_result_click":
      return { type: "search", label: "Searched" };
    default:
      return { type: "none", label: "—" };
  }
};

const resolveDisplayName = (user: any, userId: string) => {
  const name = String(user?.name || "").trim();
  const company = String(user?.companyName || "").trim();
  const email = String(user?.email || "").trim();
  const phone = String(user?.phone || "").trim();
  if (name) return name;
  if (company) return company;
  if (email) return email;
  if (phone) return phone;
  if (userId) return `User · ${userId.slice(-6)}`;
  return "Unknown user";
};

const resolveRoleKey = (user: any) => {
  const fromLookup = String(user?.roleName || "").trim().toLowerCase();
  if (fromLookup) return fromLookup;
  const embedded = String(user?.role || "").trim().toLowerCase();
  if (embedded && embedded !== "requester" && embedded !== "customer") return embedded;
  return "";
};

async function loadUsersByIds(db: any, userIds: string[]) {
  const objectIds = userIds
    .filter((id) => mongoose.Types.ObjectId.isValid(id))
    .map((id) => new mongoose.Types.ObjectId(id));
  if (!objectIds.length) return [] as any[];

  try {
    const aggregated = await db
      .collection("users")
      .aggregate([
        { $match: { _id: { $in: objectIds } } },
        {
          $lookup: {
            from: "roles",
            localField: "roleId",
            foreignField: "_id",
            as: "roleDoc",
          },
        },
        {
          $project: {
            name: 1,
            companyName: 1,
            email: 1,
            phone: 1,
            city: 1,
            state: 1,
            locality: 1,
            avatar: 1,
            profileImage: 1,
            photo: 1,
            role: 1,
            roleName: {
              $ifNull: [
                { $arrayElemAt: ["$roleDoc.name", 0] },
                { $ifNull: ["$role", ""] },
              ],
            },
          },
        },
      ])
      .toArray();
    if (aggregated?.length) return aggregated;
  } catch {
    // fall through to simple find
  }

  return db
    .collection("users")
    .find({ _id: { $in: objectIds } })
    .project({
      name: 1,
      companyName: 1,
      email: 1,
      phone: 1,
      city: 1,
      state: 1,
      locality: 1,
      avatar: 1,
      profileImage: 1,
      photo: 1,
      role: 1,
      roleId: 1,
    })
    .toArray()
    .catch(() => []);
}

/**
 * Platform-wide activity feed for Owners / Agents / Builders.
 * Returns WHO / WHAT / WHEN / GOT rows + sidebar action counts.
 */
const istDayBounds = (offsetDays = 0) => {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const base = new Date(Date.now() + offsetDays * 86_400_000);
  const day = fmt.format(base); // YYYY-MM-DD in IST
  const since = new Date(`${day}T00:00:00+05:30`);
  const until = new Date(`${day}T23:59:59.999+05:30`);
  return { since, until };
};

export async function getAllUsersActivity(req: AuthRequest, res: Response) {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const groupBy = String(req.query.groupBy || "user").toLowerCase(); // user | event
    // Larger pool when grouping by user so unique-user pages stay accurate at scale
    const poolLimit =
      groupBy === "user"
        ? Math.min(8000, Math.max(800, page * pageSize * 40))
        : Math.min(1000, Math.max(300, page * pageSize * 3));
    const action = String(req.query.action || "all").toLowerCase();
    const role = String(req.query.role || "all").toLowerCase();
    const q = String(req.query.q || "").trim().toLowerCase();
    const userIdFilter = String(req.query.userId || "").trim();
    const projectIdFilter = String(req.query.projectId || "").trim();
    const includeNoise = String(req.query.includeNoise || "") === "1";
    const range = String(req.query.range || "").toLowerCase();
    const fromRaw = String(req.query.from || "").trim();
    const toRaw = String(req.query.to || "").trim();
    const projectObjectId =
      projectIdFilter && mongoose.Types.ObjectId.isValid(projectIdFilter)
        ? new mongoose.Types.ObjectId(projectIdFilter)
        : null;

    let since: Date;
    let until: Date | null = null;
    let hours = Math.min(24 * 30, Math.max(1, Number(req.query.hours) || 24));

    if (fromRaw && toRaw) {
      const fromDate = new Date(fromRaw);
      const toDate = new Date(toRaw);
      if (!Number.isNaN(fromDate.getTime()) && !Number.isNaN(toDate.getTime()) && fromDate <= toDate) {
        since = fromDate;
        until = toDate;
        hours = Math.max(1, Math.ceil((toDate.getTime() - fromDate.getTime()) / 3_600_000));
      } else {
        since = new Date(Date.now() - hours * 60 * 60 * 1000);
      }
    } else if (range === "yesterday") {
      ({ since, until } = istDayBounds(-1));
      hours = 24;
    } else if (range === "today") {
      ({ since, until } = istDayBounds(0));
      hours = 24;
    } else if (range === "7d" || range === "7days") {
      since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      hours = 168;
    } else if (range === "30d" || range === "month") {
      since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      hours = 720;
    } else if (range === "90d" || range === "quarter") {
      since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      hours = 24 * 90;
    } else if (range === "12mo" || range === "year" || range === "365d" || range === "all") {
      since = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
      hours = 24 * 365;
    } else {
      since = new Date(Date.now() - hours * 60 * 60 * 1000);
    }

    const timeMatch: Record<string, unknown> = until
      ? { $gte: since, $lte: until }
      : { $gte: since };

    const actionEventTypes = ACTION_GROUPS[action] || [];
    const contactEventTypes = ACTION_GROUPS.contacts || [];
    const eventTypeFilter =
      action !== "all" && actionEventTypes.length
        ? { eventType: { $in: actionEventTypes } }
        : action === "leads"
          ? {
              eventType: {
                $in: [...contactEventTypes, "site_visit_submitted", "booking_started"],
              },
            }
          : {};

    const baseMatch: Record<string, unknown> = {
      serverTimestamp: timeMatch,
      ...eventTypeFilter,
    };
    if (userIdFilter && mongoose.Types.ObjectId.isValid(userIdFilter)) {
      baseMatch.userId = new mongoose.Types.ObjectId(userIdFilter);
    }
    if (projectObjectId) {
      baseMatch.projectId = projectObjectId;
    }
    if (!includeNoise && action === "all") {
      baseMatch.eventType = { $nin: [...NOISE_EVENTS] };
    }

    const createdAtMatch = until ? { $gte: since, $lte: until } : { $gte: since };
    const brochureMatch: Record<string, unknown> = { createdAt: createdAtMatch };
    const leadMatch: Record<string, unknown> = { createdAt: createdAtMatch };
    if (userIdFilter && mongoose.Types.ObjectId.isValid(userIdFilter)) {
      const userObjectId = new mongoose.Types.ObjectId(userIdFilter);
      brochureMatch.$or = [{ userId: userIdFilter }, { userId: userObjectId }];
      leadMatch.$or = [{ createdBy: userIdFilter }, { createdBy: userObjectId }];
    }
    if (projectObjectId) {
      brochureMatch.projectId = projectObjectId;
      leadMatch.projectId = projectObjectId;
    }

    const typeCountMatch: Record<string, unknown> = {
      serverTimestamp: timeMatch,
      ...(userIdFilter && mongoose.Types.ObjectId.isValid(userIdFilter)
        ? { userId: new mongoose.Types.ObjectId(userIdFilter) }
        : {}),
      ...(projectObjectId ? { projectId: projectObjectId } : {}),
    };

    const db = mongoose.connection?.db;
    const [rawEvents, brochureDocs, leadDocs, typeCounts] = await Promise.all([
      UserInteraction.find(baseMatch).sort({ serverTimestamp: -1 }).limit(poolLimit).lean(),
      db
        ? db
            .collection("brochuredownloads")
            .find(brochureMatch)
            .sort({ createdAt: -1 })
            .limit(userIdFilter || projectObjectId ? 200 : 100)
            .toArray()
            .catch(() => [])
        : Promise.resolve([]),
      db
        ? db
            .collection("propertyleads")
            .find(leadMatch)
            .project({ _id: 1, createdBy: 1, projectId: 1, status: 1, name: 1, createdAt: 1 })
            .sort({ createdAt: -1 })
            .limit(200)
            .toArray()
            .catch(() => [])
        : Promise.resolve([]),
      UserInteraction.aggregate([
        { $match: typeCountMatch },
        { $group: { _id: "$eventType", count: { $sum: 1 } } },
      ]),
    ]);

    // Synthetic brochure rows if interaction event missing but collection has download
    const interactionBrochureKeys = new Set(
      rawEvents
        .filter((e) => e.eventType === "brochure_downloaded")
        .map((e) => `${e.userId}:${e.projectId || ""}`),
    );
    const syntheticBrochures = (brochureDocs || [])
      .filter((doc: any) => !interactionBrochureKeys.has(`${doc.userId}:${doc.projectId || ""}`))
      .map((doc: any) => ({
        _id: doc._id,
        userId: doc.userId,
        projectId: doc.projectId,
        eventType: "brochure_downloaded",
        eventCategory: "conversion",
        pageUrl: "/brochure",
        source: "brochure_download",
        serverTimestamp: doc.createdAt || doc.updatedAt,
        clientTimestamp: doc.createdAt || doc.updatedAt,
        sessionId: `brochure-${doc._id}`,
        promotionType: "normal",
        __synthetic: true,
      }));

    const combined = [...rawEvents, ...syntheticBrochures].sort(
      (a: any, b: any) =>
        new Date(b.serverTimestamp || 0).getTime() - new Date(a.serverTimestamp || 0).getTime(),
    ).slice(0, poolLimit);

    const userIds = [...new Set(combined.map((e: any) => String(e.userId || "")).filter(Boolean))];
    const users = userIds.length && db ? await loadUsersByIds(db, userIds) : [];
    const userMap = new Map((users || []).map((u: any) => [String(u._id), u]));

    // Resolve role names when aggregate fallback only returned roleId
    const missingRoleIds = [
      ...new Set(
        (users || [])
          .filter((u: any) => !u.roleName && u.roleId)
          .map((u: any) => String(u.roleId)),
      ),
    ].filter(
      (id): id is string =>
        typeof id === "string" && mongoose.Types.ObjectId.isValid(id),
    );
    if (db && missingRoleIds.length) {
      const roleDocs = await db
        .collection("roles")
        .find({
          _id: {
            $in: missingRoleIds.map((id) => new mongoose.Types.ObjectId(id)),
          },
        })
        .project({ name: 1 })
        .toArray()
        .catch(() => []);
      const roleNameById = new Map(
        (roleDocs || []).map((r: any) => [String(r._id), String(r.name || "")]),
      );
      for (const user of users || []) {
        if (!user.roleName && user.roleId) {
          user.roleName = roleNameById.get(String(user.roleId)) || "";
        }
      }
    }

    const entities = await loadJourneyEntities(combined);
    const entityMap = new Map(entities.map((entity: any) => [entity.id, entity]));

    const leadsByUserProject = new Map<string, any>();
    for (const lead of leadDocs || []) {
      const key = `${lead.createdBy}:${lead.projectId || ""}`;
      if (!leadsByUserProject.has(key)) leadsByUserProject.set(key, lead);
    }

    const allowedRoles = new Set(["user", "owner", "agent", "builder", "builder_staff"]);
    let items = combined.map((event: any) => {
      const userId = String(event.userId || "");
      const user: any = userMap.get(userId) || null;
      const entity =
        entityMap.get(String(event.propertyId || event.plotId || event.projectId || "")) || null;
      const lead = leadsByUserProject.get(`${event.userId}:${event.projectId || ""}`);
      const group = actionGroupFor(event.eventType);
      const got = describeGot(event.eventType, lead);
      const roleKey = resolveRoleKey(user) || "user";
      return {
        id: String(event._id),
        actionKey: group === "contacts" && got.type === "lead" ? "leads" : group,
        eventType: event.eventType,
        who: {
          userId,
          name: resolveDisplayName(user, userId),
          role: roleLabel(roleKey),
          roleKey,
          avatar: user?.avatar || user?.profileImage || user?.photo || null,
          city: user?.city || null,
          state: user?.state || null,
          email: user?.email || null,
          phone: user?.phone || null,
          resolved: Boolean(user),
        },
        what: describeWhat(event, entity?.title),
        when: event.serverTimestamp || event.clientTimestamp,
        got,
        entity: entity
          ? { id: entity.id, title: entity.title, kind: entity.kind, location: entity.location }
          : null,
        pageUrl: event.pageUrl || null,
        source: event.source || null,
      };
    });

    // Keep platform end-users; also keep unresolved ids (deleted accounts) so history is not hidden
    items = items.filter(
      (item) =>
        allowedRoles.has(item.who.roleKey) ||
        item.who.roleKey === "owner" ||
        !item.who.resolved,
    );
    if (role !== "all") {
      const roleAliases: Record<string, string[]> = {
        owner: ["user", "owner"],
        user: ["user", "owner"],
        agent: ["agent"],
        builder: ["builder"],
        builder_staff: ["builder_staff"],
      };
      const aliases = roleAliases[role] || [role];
      items = items.filter((item) => aliases.includes(item.who.roleKey));
    }
    if (q) {
      items = items.filter((item) =>
        [
          item.who?.name,
          item.who?.userId,
          item.who?.email,
          item.who?.phone,
          item.who?.city,
          item.who?.state,
          item.what,
          item.entity?.title,
          item.entity?.id,
          item.entity?.location,
          item.got?.label,
          item.got?.id,
          item.pageUrl,
          item.eventType,
        ]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q)),
      );
    }
    if (action === "leads") {
      items = items.filter(
        (item) =>
          item.got?.type === "lead" ||
          item.actionKey === "leads" ||
          item.actionKey === "contacts",
      );
    } else if (action !== "all" && actionEventTypes.length) {
      items = items.filter(
        (item) =>
          item.actionKey === action || actionEventTypes.includes(item.eventType),
      );
    }

    const countMap: Record<string, number> = {};
    for (const row of typeCounts || []) {
      countMap[String(row._id)] = Number(row.count || 0);
    }
    const groupCount = (key: string) =>
      (ACTION_GROUPS[key] || []).reduce((sum, type) => sum + (countMap[type] || 0), 0);

    const brochureExtra = (brochureDocs || []).length;
    const sidebar = [
      { key: "all", label: "All activity", count: Object.values(countMap).reduce((a, b) => a + b, 0) + brochureExtra },
      { key: "browsing", label: "Browsing", count: groupCount("browsing") },
      { key: "searches", label: "Searches", count: groupCount("searches") },
      { key: "views", label: "Views", count: groupCount("views") },
      { key: "gallery", label: "Gallery / Map / EMI", count: groupCount("gallery") },
      { key: "shortlists", label: "Shortlists", count: groupCount("shortlists") },
      { key: "brochures", label: "Brochure downloads", count: groupCount("brochures") + brochureExtra },
      { key: "contacts", label: "Contacts", count: groupCount("contacts") },
      { key: "leads", label: "Leads got", count: (leadDocs || []).length },
      { key: "visits", label: "Site visits", count: groupCount("visits") },
    ];

    const activeUserIds = new Set(
      combined
        .filter((e: any) => new Date(e.serverTimestamp).getTime() >= Date.now() - 15 * 60_000)
        .map((e: any) => String(e.userId)),
    );

    // Count top active from flat event list before collapsing duplicates
    const topActiveMap = new Map<string, { userId: string; name: string; role: string; count: number }>();
    for (const item of items) {
      const cur = topActiveMap.get(item.who.userId) || {
        userId: item.who.userId,
        name: item.who.name,
        role: item.who.role,
        count: 0,
      };
      cur.count += 1;
      topActiveMap.set(item.who.userId, cur);
    }

    // Collapse duplicate WHO rows: one card per user with latest action + count
    let feedItems: any[] = items;
    if (groupBy === "user") {
      const byUser = new Map<string, any>();
      for (const item of items) {
        const key = item.who.userId || item.id;
        const existing = byUser.get(key);
        if (!existing) {
          byUser.set(key, {
            ...item,
            id: `user-${key}`,
            actionCount: 1,
            recentActions: [
              {
                id: item.id,
                what: item.what,
                when: item.when,
                got: item.got,
                eventType: item.eventType,
                entity: item.entity,
                pageUrl: item.pageUrl,
                source: item.source,
              },
            ],
          });
          continue;
        }
        existing.actionCount += 1;
        if (existing.recentActions.length < 8) {
          existing.recentActions.push({
            id: item.id,
            what: item.what,
            when: item.when,
            got: item.got,
            eventType: item.eventType,
            entity: item.entity,
            pageUrl: item.pageUrl,
            source: item.source,
          });
        }
      }
      feedItems = [...byUser.values()];
    }

    const total = feedItems.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * pageSize;
    const pagedItems = feedItems.slice(start, start + pageSize);

    return res.json({
      success: true,
      data: {
        generatedAt: new Date(),
        since,
        until,
        range: range || (fromRaw && toRaw ? "custom" : "hours"),
        hours,
        groupBy,
        kpis: {
          activeNow: activeUserIds.size,
          actionsToday: sidebar.find((s) => s.key === "all")?.count || 0,
          leadsGot: (leadDocs || []).length,
          visitsGot: groupCount("visits"),
          brochuresGot: groupCount("brochures") + brochureExtra,
          contactsGot: groupCount("contacts"),
          shortlistsGot: groupCount("shortlists"),
        },
        sidebar,
        needsAttention: [
          (leadDocs || []).filter((l: any) => !l.status || l.status === "new" || l.status === "open").length
            ? {
                text: `${(leadDocs || []).filter((l: any) => !l.status || l.status === "new" || l.status === "open").length} new leads in period`,
                tone: "amber",
              }
            : null,
          groupCount("contacts") > 20
            ? { text: "Contact activity is high — review unassigned follow-ups", tone: "green" }
            : null,
        ].filter(Boolean),
        topActive: [...topActiveMap.values()].sort((a, b) => b.count - a.count).slice(0, 5),
        items: pagedItems,
        pagination: {
          page: safePage,
          pageSize,
          total,
          totalPages,
          rangeStart: total === 0 ? 0 : start + 1,
          rangeEnd: Math.min(start + pageSize, total),
          mode: groupBy === "user" ? "users" : "events",
        },
      },
    });
  } catch (error) {
    console.error("getAllUsersActivity failed", error);
    return res.status(500).json({ success: false, message: "Unable to load all-users activity" });
  }
}

const normalizeActorRole = (value = "") =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_");

const isCceActorRole = (roleName = "") => normalizeActorRole(roleName).includes("customer_care");

const isOversightActorRole = (roleName = "") => {
  const key = normalizeActorRole(roleName);
  return (
    key === "super_admin" ||
    key === "admin" ||
    key.includes("team_lead") ||
    key.includes("support_head")
  );
};

/** IST calendar window ending today (inclusive), spanning `days` days. */
const istRollingDayBounds = (days: number) => {
  const end = istDayBounds(0);
  const startDay = istDayBounds(-(Math.max(1, days) - 1));
  return { since: startDay.since, until: end.until };
};

const resolveAssignedActivityWindow = (query: Record<string, unknown>) => {
  const range = String(query.range || "today").toLowerCase();
  const fromRaw = String(query.from || "").trim();
  const toRaw = String(query.to || "").trim();

  // Prefer explicit from/to from UI for every preset (keeps click ranges exact).
  if (fromRaw && toRaw) {
    const fromDate = new Date(fromRaw.includes("T") ? fromRaw : `${fromRaw}T00:00:00+05:30`);
    const toDate = new Date(toRaw.includes("T") ? toRaw : `${toRaw}T23:59:59.999+05:30`);
    if (!Number.isNaN(fromDate.getTime()) && !Number.isNaN(toDate.getTime()) && fromDate <= toDate) {
      return {
        since: fromDate,
        until: toDate,
        range: range === "custom" ? "custom" : range || "custom",
      };
    }
  }
  if (range === "yesterday") {
    const bounds = istDayBounds(-1);
    return { ...bounds, range: "yesterday" };
  }
  if (range === "7d" || range === "7days") {
    return { ...istRollingDayBounds(7), range: "7d" };
  }
  if (range === "30d" || range === "month") {
    return { ...istRollingDayBounds(30), range: "30d" };
  }
  if (range === "90d" || range === "quarter") {
    return { ...istRollingDayBounds(90), range: "90d" };
  }
  if (range === "12mo" || range === "year" || range === "365d" || range === "all") {
    // Interaction retention is ~90 days; cap "all" to retained window.
    return { ...istRollingDayBounds(90), range: range === "all" ? "all" : "12mo" };
  }
  const bounds = istDayBounds(0);
  return { ...bounds, range: "today" };
};

const CLICK_EVENT_TYPES = new Set([
  "featured_project_click",
  "project_click",
  "property_click",
  "search_result_click",
  "whatsapp_clicked",
  "phone_clicked",
  "contact_owner_clicked",
]);

const VIEW_EVENT_TYPES = new Set([
  "page_view",
  "listing_impression",
  "featured_project_impression",
  "project_view",
  "property_view",
  "plot_view",
  "gallery_open",
  "gallery_image_view",
  "map_open",
]);

/**
 * End-user friendly event labels for Super Admin Top Events.
 * - Featured project = project
 * - Impression = view (same meaning for leadership UI)
 */
const canonicalEngagementEvent = (eventType: string) => {
  const key = String(eventType || "").trim().toLowerCase();

  // Clicks
  if (key === "featured_project_click" || key === "project_click") {
    return { key: "project_click", label: "Project click" };
  }
  if (key === "property_click") return { key: "property_click", label: "Property click" };
  if (key === "search_result_click") {
    return { key: "search_result_click", label: "Search result click" };
  }
  if (key === "whatsapp_clicked") return { key: "whatsapp_clicked", label: "WhatsApp click" };
  if (key === "phone_clicked") return { key: "phone_clicked", label: "Phone click" };
  if (key === "contact_owner_clicked") {
    return { key: "contact_owner_clicked", label: "Contact click" };
  }

  // Views (impressions count as views)
  if (
    key === "featured_project_impression" ||
    key === "project_view" ||
    key === "project_impression"
  ) {
    return { key: "project_view", label: "Project view" };
  }
  if (key === "listing_impression" || key === "property_view" || key === "plot_view") {
    return { key: "property_view", label: "Property view" };
  }
  if (key === "page_view") return { key: "page_view", label: "Page view" };
  if (key === "gallery_open" || key === "gallery_image_view") {
    return { key: "gallery_view", label: "Gallery view" };
  }
  if (key === "map_open") return { key: "map_view", label: "Map view" };

  return {
    key,
    label: key
      .replace(/_/g, " ")
      .replace(/\bimpression\b/gi, "view")
      .replace(/\bfeatured project\b/gi, "project")
      .replace(/\b\w/g, (c) => c.toUpperCase()),
  };
};

/**
 * Super Admin platform engagement: website/app clicks + all actions by day (or hour for Today).
 * Same auth model as all-users-activity (user:view / super_admin|admin).
 */
export async function getPlatformEngagement(req: AuthRequest, res: Response) {
  try {
    const window = resolveAssignedActivityWindow(req.query as Record<string, unknown>);
    const since = window.since;
    const until = window.until;
    const rangeKey = window.range || "today";
    const useHourly = rangeKey === "today";

    const match: Record<string, unknown> = {
      serverTimestamp: until ? { $gte: since, $lte: until } : { $gte: since },
      eventType: { $nin: [...NOISE_EVENTS] },
    };

    const dayFormat = useHourly ? "%Y-%m-%dT%H" : "%Y-%m-%d";
    const rows = await UserInteraction.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            bucket: {
              $dateToString: {
                format: dayFormat,
                date: "$serverTimestamp",
                timezone: "Asia/Kolkata",
              },
            },
            eventType: "$eventType",
          },
          count: { $sum: 1 },
        },
      },
    ]);

    const bucketMap = new Map<
      string,
      {
        key: string;
        clicks: number;
        views: number;
        actions: number;
        browsing: number;
        searches: number;
        contacts: number;
        visits: number;
        brochures: number;
        shortlists: number;
      }
    >();

    const ensureBucket = (key: string) => {
      if (!bucketMap.has(key)) {
        bucketMap.set(key, {
          key,
          clicks: 0,
          views: 0,
          actions: 0,
          browsing: 0,
          searches: 0,
          contacts: 0,
          visits: 0,
          brochures: 0,
          shortlists: 0,
        });
      }
      return bucketMap.get(key)!;
    };

    const byActionType = new Map<string, number>();
    let totalClicks = 0;
    let totalViews = 0;
    let totalActions = 0;

    for (const row of rows || []) {
      const key = String(row?._id?.bucket || "");
      const eventType = String(row?._id?.eventType || "");
      const count = Number(row?.count) || 0;
      if (!key || !eventType || !count) continue;

      const bucket = ensureBucket(key);
      bucket.actions += count;
      totalActions += count;
      byActionType.set(eventType, (byActionType.get(eventType) || 0) + count);

      if (CLICK_EVENT_TYPES.has(eventType) || /click/i.test(eventType)) {
        bucket.clicks += count;
        totalClicks += count;
      }
      if (VIEW_EVENT_TYPES.has(eventType) || /view|impression/i.test(eventType)) {
        bucket.views += count;
        totalViews += count;
      }

      const group = actionGroupFor(eventType);
      if (group === "browsing") bucket.browsing += count;
      else if (group === "searches") bucket.searches += count;
      else if (group === "contacts") bucket.contacts += count;
      else if (group === "visits") bucket.visits += count;
      else if (group === "brochures") bucket.brochures += count;
      else if (group === "shortlists") bucket.shortlists += count;
      else if (group === "views") {
        // listing/project view+click group — already counted in views/clicks
      }
    }

    // Fill empty buckets across the window so charts stay continuous
    const series: Array<ReturnType<typeof ensureBucket> & { label: string }> = [];
    if (useHourly) {
      for (let h = 0; h < 24; h += 1) {
        const day = since.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
        const key = `${day}T${String(h).padStart(2, "0")}`;
        const bucket = ensureBucket(key);
        series.push({
          ...bucket,
          label: `${h % 12 === 0 ? 12 : h % 12}${h < 12 ? "a" : "p"}`,
        });
      }
    } else {
      const cursor = new Date(since.getTime());
      const endMs = until ? until.getTime() : Date.now();
      let guard = 0;
      while (cursor.getTime() <= endMs && guard < 120) {
        const key = cursor.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
        const bucket = ensureBucket(key);
        const label = cursor.toLocaleDateString("en-IN", {
          timeZone: "Asia/Kolkata",
          day: "2-digit",
          month: "short",
        });
        series.push({ ...bucket, label });
        cursor.setUTCDate(cursor.getUTCDate() + 1);
        guard += 1;
      }
    }

    // De-dupe filled series keys (timezone edge) while keeping order
    const seen = new Set<string>();
    const daily = series.filter((row) => {
      if (seen.has(row.key)) return false;
      seen.add(row.key);
      return true;
    });

    const actionMix = Object.entries(ACTION_GROUPS).map(([key, types]) => ({
      key,
      label: key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      value: types.reduce((sum, type) => sum + (byActionType.get(type) || 0), 0),
    })).filter((row) => row.value > 0)
      .sort((a, b) => b.value - a.value);

    // Roll featured_project_* into project_* so Top Events say "Project …", not "Featured project …"
    const topEventMap = new Map<string, { key: string; label: string; value: number }>();
    for (const [eventType, value] of byActionType.entries()) {
      const canonical = canonicalEngagementEvent(eventType);
      const existing = topEventMap.get(canonical.key);
      if (existing) {
        existing.value += value;
      } else {
        topEventMap.set(canonical.key, {
          key: canonical.key,
          label: canonical.label,
          value,
        });
      }
    }
    const topEvents = [...topEventMap.values()]
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);

    return res.json({
      success: true,
      data: {
        range: rangeKey,
        from: since.toISOString(),
        to: (until || new Date()).toISOString(),
        granularity: useHourly ? "hour" : "day",
        summary: {
          clicks: totalClicks,
          views: totalViews,
          actions: totalActions,
          clickRate:
            totalViews > 0 && Number.isFinite(totalClicks)
              ? Math.round((totalClicks / totalViews) * 1000) / 10
              : null,
        },
        daily,
        actionMix,
        topEvents,
      },
    });
  } catch (error) {
    console.error("getPlatformEngagement failed", error);
    return res.status(500).json({ success: false, message: "Unable to load platform engagement" });
  }
}

/**
 * Scalable single-user activity for Client Progress Queue.
 * - Indexed query: userId + serverTimestamp
 * - True skip/limit pagination (no large in-memory pools)
 * - CCE may only read users assigned to them (followUpAssignedTo)
 */
export async function getAssignedUserActivity(req: AuthRequest, res: Response) {
  try {
    const targetUserId = String(req.params.userId || req.query.userId || "").trim();
    if (!targetUserId || !mongoose.Types.ObjectId.isValid(targetUserId)) {
      return res.status(400).json({ success: false, message: "Valid userId is required" });
    }

    const actorId = String(req.user?.id || "");
    const actorRole = String(req.user?.roleName || "");
    const oversight = isOversightActorRole(actorRole);
    const cce = isCceActorRole(actorRole);

    if (!oversight && cce) {
      const target = await User.findById(targetUserId)
        .select("followUpAssignedTo name email phone city state")
        .lean();
      if (!target) {
        return res.status(404).json({ success: false, message: "User not found" });
      }
      const ownerId = target.followUpAssignedTo ? String(target.followUpAssignedTo) : "";
      if (!ownerId || ownerId !== actorId) {
        return res.status(403).json({
          success: false,
          code: "ASSIGNMENT_REQUIRED",
          message: "You can only view activity for users assigned to you",
        });
      }
    } else if (!oversight) {
      // Non-CCE staff still need user:view (enforced by route); allow read.
    }

    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(50, Math.max(1, Number(req.query.limit) || 25));
    const { since, until, range } = resolveAssignedActivityWindow(
      req.query as Record<string, unknown>,
    );
    const timeMatch = until ? { $gte: since, $lte: until } : { $gte: since };
    const targetObjectId = new mongoose.Types.ObjectId(targetUserId);

    // Match userId + (server or client timestamp) so older rows still surface.
    const match: Record<string, unknown> = {
      $and: [
        { $or: [{ userId: targetObjectId }, { userId: targetUserId as any }] },
        { eventType: { $nin: [...NOISE_EVENTS] } },
        {
          $or: [{ serverTimestamp: timeMatch }, { clientTimestamp: timeMatch }],
        },
      ],
    };

    const db = mongoose.connection?.db;
    const [rawEvents, brochureDocs, leadDocs] = await Promise.all([
      UserInteraction.find(match)
        .sort({ serverTimestamp: -1 })
        .limit(500)
        .lean(),
      db
        ? db
            .collection("brochuredownloads")
            .find({
              createdAt: timeMatch,
              $or: [{ userId: targetUserId }, { userId: targetObjectId }],
            })
            .sort({ createdAt: -1 })
            .limit(200)
            .toArray()
            .catch(() => [])
        : Promise.resolve([]),
      db
        ? db
            .collection("propertyleads")
            .find({
              createdAt: timeMatch,
              $or: [{ createdBy: targetUserId }, { createdBy: targetObjectId }],
            })
            .project({ _id: 1, createdBy: 1, projectId: 1, status: 1, createdAt: 1 })
            .sort({ createdAt: -1 })
            .limit(200)
            .toArray()
            .catch(() => [])
        : Promise.resolve([]),
    ]);

    const interactionBrochureKeys = new Set(
      (rawEvents || [])
        .filter((e: any) => e.eventType === "brochure_downloaded")
        .map((e: any) => `${e.userId}:${e.projectId || ""}`),
    );
    const syntheticBrochures = (brochureDocs || [])
      .filter(
        (doc: any) =>
          !interactionBrochureKeys.has(`${doc.userId}:${doc.projectId || ""}`),
      )
      .map((doc: any) => ({
        _id: doc._id,
        userId: doc.userId,
        projectId: doc.projectId,
        eventType: "brochure_downloaded",
        eventCategory: "conversion",
        pageUrl: "/brochure",
        source: "brochure_download",
        serverTimestamp: doc.createdAt || doc.updatedAt,
        clientTimestamp: doc.createdAt || doc.updatedAt,
        sessionId: `brochure-${doc._id}`,
        promotionType: "normal",
        __synthetic: true,
      }));

    const combined = [...(rawEvents || []), ...syntheticBrochures].sort(
      (a: any, b: any) =>
        new Date(b.serverTimestamp || b.clientTimestamp || 0).getTime() -
        new Date(a.serverTimestamp || a.clientTimestamp || 0).getTime(),
    );

    const total = combined.length;
    const pageSlice = combined.slice((page - 1) * pageSize, page * pageSize);

    const leadsByProject = new Map<string, any>();
    for (const lead of leadDocs || []) {
      const key = String(lead.projectId || "");
      if (!leadsByProject.has(key)) leadsByProject.set(key, lead);
    }

    const entities = await loadJourneyEntities(pageSlice);
    const entityMap = new Map(entities.map((entity: any) => [entity.id, entity]));

    const items = pageSlice.map((event: any) => {
      const entity =
        entityMap.get(String(event.propertyId || event.plotId || event.projectId || "")) ||
        null;
      const lead =
        leadsByProject.get(String(event.projectId || "")) ||
        leadsByProject.get("") ||
        null;
      const got = describeGot(event.eventType, lead);
      return {
        id: String(event._id),
        eventType: event.eventType,
        what: describeWhat(event, entity?.title),
        when: event.serverTimestamp || event.clientTimestamp,
        got,
        entity: entity
          ? {
              id: entity.id,
              title: entity.title,
              kind: entity.kind,
              location: entity.location,
            }
          : null,
        pageUrl: event.pageUrl || null,
        source: event.source || null,
      };
    });

    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
    const rangeEnd = Math.min(page * pageSize, total);

    return res.json({
      success: true,
      data: {
        userId: targetUserId,
        range,
        since,
        until,
        items,
        pagination: {
          page,
          pageSize,
          total,
          totalPages,
          rangeStart,
          rangeEnd,
          mode: "events",
        },
      },
    });
  } catch (error) {
    console.error("getAssignedUserActivity failed", error);
    return res.status(500).json({ success: false, message: "Unable to load user activity" });
  }
}
