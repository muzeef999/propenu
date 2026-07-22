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
