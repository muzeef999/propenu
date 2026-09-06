import { Types } from "mongoose";
import Lead from "../models/LeadModel";
import PublicLead from "../models/PublicLead";
import FeaturedProject from "../models/featurePropertiesModel";
import Residential from "../models/residentialModel";
import Commercial from "../models/commercialModel";
import Agricultural from "../models/agriculturalModel";
import LandPlot from "../models/landModel";

const categoryModels = {
  featured: FeaturedProject,
  residential: Residential,
  commercial: Commercial,
  agricultural: Agricultural,
  land: LandPlot,
} as const;
type Category = keyof typeof categoryModels;

const STATUS_RANK: Record<string, number> = {
  sale: 6,
  site_visit: 5,
  follow_up: 4,
  interested: 3,
  new_lead: 2,
  not_interested: 1,
};

const leadCategory = (lead: any): Category => {
  const value = String(lead.propertyType || lead.propertyModel || "").toLowerCase();
  if (value.includes("featured")) return "featured";
  if (value.includes("residential")) return "residential";
  if (value.includes("commercial")) return "commercial";
  if (value.includes("agricultural")) return "agricultural";
  if (value.includes("land")) return "land";
  if (lead.source === "site" || lead.source === "imported") return "featured";
  return "featured";
};

const safeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Local calendar day bounds — avoids UTC midnight shifting IST "today" leads. */
const parseDayBound = (value?: string, endOfDay = false): Date | null => {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value).trim());
  if (match) {
    const year = Number(match[1]);
    const month = Number(match[2]) - 1;
    const day = Number(match[3]);
    return endOfDay
      ? new Date(year, month, day, 23, 59, 59, 999)
      : new Date(year, month, day, 0, 0, 0, 0);
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  if (endOfDay) parsed.setHours(23, 59, 59, 999);
  else parsed.setHours(0, 0, 0, 0);
  return parsed;
};

const localDayKey = (value: Date) => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const normalizePhone = (value?: string) => {
  const digits = String(value || "").replace(/\D/g, "");
  if (!digits) return "";
  return digits.length > 10 ? digits.slice(-10) : digits;
};

const pickRicher = (...values: unknown[]) => {
  for (const value of values) {
    const text = String(value || "").trim();
    if (text) return text;
  }
  return "";
};

const bestStatus = (statuses: string[]) =>
  statuses.reduce((best, status) => {
    const rank = STATUS_RANK[status] || 0;
    const bestRank = STATUS_RANK[best] || 0;
    return rank > bestRank ? status : best;
  }, statuses[0] || "new_lead");

const buildOrigin = (row: any) => {
  const source = String(row.source || "site").toLowerCase();
  const category = String(row.project?.category || "featured");
  const isProject = category === "featured";

  if (source === "imported") {
    return {
      channel: "Imported",
      entryPoint: isProject ? "CSV / bulk import · Featured project" : "CSV / bulk import · Property",
      path: ["Import", isProject ? "Featured project" : "Property listing", "Lead created"],
      label: "Imported",
    };
  }
  if (source === "direct") {
    return {
      channel: "Logged-in user",
      entryPoint: isProject
        ? "App / website · Contact on project"
        : "App / website · Contact on property",
      path: [
        "Website / App",
        isProject ? "Project detail" : "Property detail",
        "Contact owner / enquiry",
      ],
      label: "Direct",
    };
  }
  return {
    channel: "Website (guest)",
    entryPoint: "Site · Featured project enquiry form",
    path: ["Website", "Featured project page", "Lead form submitted"],
    label: "Site",
  };
};

const dedupeKey = (row: any) => {
  const projectId = String(row.project?._id || "");
  const phone = normalizePhone(row.phone);
  const email = String(row.email || "")
    .trim()
    .toLowerCase();
  if (phone) return `p:${phone}::${projectId}`;
  if (email) return `e:${email}::${projectId}`;
  return `id:${row._id}::${projectId}`;
};

/** Collapse same person + same project/property into one unique lead row. */
const collapseDuplicateLeads = (rows: any[]) => {
  const groups = new Map<string, any[]>();
  for (const row of rows) {
    const key = dedupeKey(row);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(row);
  }

  return [...groups.values()]
    .map((group) => {
      const sorted = [...group].sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
      const first = sorted[0];
      const last = sorted[sorted.length - 1];
      const primary = {
        ...first,
        name: pickRicher(...sorted.map((row) => row.name).reverse()) || first.name,
        email: pickRicher(...sorted.map((row) => row.email).reverse()) || first.email,
        phone: pickRicher(...sorted.map((row) => row.phone)) || first.phone,
        message:
          pickRicher(...sorted.map((row) => row.message).reverse()) || first.message,
        purchaseTimeline:
          pickRicher(...sorted.map((row) => row.purchaseTimeline).reverse()) ||
          first.purchaseTimeline,
        budgetRange:
          pickRicher(...sorted.map((row) => row.budgetRange).reverse()) ||
          first.budgetRange,
        status: bestStatus(sorted.map((row) => String(row.status || "new_lead"))),
        listingType: pickRicher(...sorted.map((row) => row.listingType)) || "",
        firstTouchAt: first.createdAt,
        lastTouchAt: last.createdAt,
        createdAt: last.createdAt,
        duplicateCount: Math.max(0, sorted.length - 1),
        submissionCount: sorted.length,
        submissions: sorted.map((row) => ({
          _id: row._id,
          name: row.name,
          phone: row.phone,
          email: row.email,
          status: row.status,
          source: row.source,
          message: row.message,
          createdAt: row.createdAt,
        })),
      };
      primary.origin = buildOrigin(primary);
      return primary;
    })
    .sort(
      (a, b) =>
        new Date(b.lastTouchAt || b.createdAt).getTime() -
        new Date(a.lastTouchAt || a.createdAt).getTime(),
    );
};

export interface AdminLeadQuery {
  page?: string;
  limit?: string;
  search?: string;
  category?: string;
  projectId?: string;
  status?: string;
  source?: string;
  state?: string;
  city?: string;
  locality?: string;
  from?: string;
  to?: string;
  creatorIds?: string;
}

export const getAdminLeadDashboard = async (
  query: AdminLeadQuery,
  exportAll = false,
) => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
  const creatorIds = String(query.creatorIds || "")
    .split(",")
    .map((id) => id.trim())
    .filter((id) => Types.ObjectId.isValid(id));
  const creatorSet = new Set(creatorIds);
  const dateFilter: Record<string, Date> = {};
  const fromDate = parseDayBound(query.from, false);
  const toDate = parseDayBound(query.to, true);
  if (fromDate) dateFilter.$gte = fromDate;
  if (toDate) dateFilter.$lte = toDate;
  const base: any = {};
  if (query.projectId) {
    const projectIds = query.projectId
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);
    if (!projectIds.length || projectIds.some((id) => !Types.ObjectId.isValid(id))) {
      throw new Error("Invalid projectId");
    }
    base.projectId = projectIds.length === 1 ? projectIds[0] : { $in: projectIds };
  }
  // Status applied after dedupe so merged "best status" is filterable.
  if (Object.keys(dateFilter).length) base.createdAt = dateFilter;

  const includePublic =
    (!query.category || query.category === "all" || query.category === "featured") &&
    (!query.source || ["all", "site", "imported"].includes(query.source));
  const includeDirect =
    !query.source || ["all", "direct"].includes(query.source);

  const [publicRows, directRows] = await Promise.all([
    includePublic
      ? PublicLead.find({
          ...base,
          ...(query.source && query.source !== "all" ? { source: query.source } : {}),
        }).lean()
      : [],
    includeDirect
      ? Lead.find(base).populate("createdBy", "name email phone").lean()
      : [],
  ]);

  const raw = [
    ...publicRows.map((row: any) => ({ ...row, source: row.source || "site" })),
    ...directRows.map((row: any) => ({
      ...row,
      source: "direct",
      listingType: row.listingType || "",
    })),
  ];

  const idsByCategory = raw.reduce<Record<Category, Set<string>>>(
    (map, row) => {
      map[leadCategory(row)].add(String(row.projectId));
      return map;
    },
    {
      featured: new Set(),
      residential: new Set(),
      commercial: new Set(),
      agricultural: new Set(),
      land: new Set(),
    },
  );

  const propertyEntries = await Promise.all(
    (Object.keys(categoryModels) as Category[]).map(async (category) => {
      const ids = [...idsByCategory[category]];
      if (!ids.length) return [];
      const model: any = categoryModels[category];
      const docs = await model
        .find({ _id: { $in: ids } })
        .select(
          "title projectName buildingName propertyCode state city locality createdBy postedBy slug heroImage gallery price priceFrom priceTo listingType promotion status",
        )
        .lean();
      return docs.map(
        (doc: any) => [String(doc._id), { ...doc, category }] as const,
      );
    }),
  );
  const properties = new Map(propertyEntries.flat());

  const ownerId = (value: unknown) => {
    if (!value) return "";
    if (typeof value === "object") {
      const nested = (value as any)?._id ?? (value as any)?.userId ?? (value as any)?.id;
      return nested ? String(nested) : "";
    }
    return String(value);
  };

  const normalized = raw.map((row: any) => {
    const property: any = properties.get(String(row.projectId)) || {};
    const snapshot: any = row.propertySnapshot || {};
    const hasLiveProperty = Boolean(property._id);
    const heroImage =
      property.heroImage?.url ||
      property.heroImage ||
      property.gallery?.[0]?.url ||
      property.gallery?.[0] ||
      snapshot.heroImage ||
      "";
    const category = leadCategory(row);

    return {
      _id: row._id,
      name: row.name,
      phone: row.phone,
      email: row.email || "",
      status: row.status || "new_lead",
      source: row.source,
      message: row.message || row.remarks || "",
      purchaseTimeline: row.purchaseTimeline || "",
      budgetRange: row.budgetRange || "",
      listingType: row.listingType || property.listingType || snapshot.listingType || "",
      createdAt: row.createdAt,
      customer:
        row.createdBy && typeof row.createdBy === "object" ? row.createdBy : null,
      project: {
        _id: row.projectId,
        title:
          property.title ||
          property.projectName ||
          property.buildingName ||
          snapshot.title ||
          (hasLiveProperty ? "Untitled property" : "Deleted property"),
        code: property.propertyCode || snapshot.code || "",
        category: snapshot.category || category,
        state: property.state || snapshot.state || "",
        city: property.city || snapshot.city || "",
        locality: property.locality || snapshot.locality || "",
        createdBy: ownerId(property.createdBy),
        postedBy: ownerId(property.postedBy?.userId ?? property.postedBy),
        slug: property.slug || snapshot.slug || "",
        heroImage,
        price: property.price ?? snapshot.price ?? null,
        priceFrom: property.priceFrom ?? snapshot.priceFrom ?? null,
        priceTo: property.priceTo ?? snapshot.priceTo ?? null,
        listingType: property.listingType || row.listingType || snapshot.listingType || "",
        promotionType: property.promotion?.type || snapshot.promotionType || "",
        status: property.status || snapshot.status || (hasLiveProperty ? "" : "deleted"),
        isDeleted: !hasLiveProperty,
      },
    };
  });

  const search = query.search ? new RegExp(safeRegex(query.search), "i") : null;
  const matchText = (actual: unknown, expected?: string) =>
    !expected ||
    expected === "all" ||
    String(actual || "").toLowerCase() === expected.toLowerCase();

  const preFiltered = normalized
    .filter((row) => {
      if (creatorSet.size) {
        const owners = [row.project.createdBy, row.project.postedBy].filter(Boolean);
        if (!owners.some((id) => creatorSet.has(id))) return false;
      }
      if (
        !matchText(row.project.category, query.category) ||
        !matchText(row.project.state, query.state) ||
        !matchText(row.project.city, query.city) ||
        !matchText(row.project.locality, query.locality)
      ) {
        return false;
      }
      return (
        !search ||
        [
          row.name,
          row.phone,
          row.email,
          row.project.title,
          row.project.code,
          row.project.state,
          row.project.city,
          row.project.locality,
        ].some((value) => search.test(String(value || "")))
      );
    })
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

  const unique = collapseDuplicateLeads(preFiltered);
  // Status filter after merge so best status on the unique row is used.
  const filtered = query.status
    ? unique.filter((row) => String(row.status) === String(query.status))
    : unique;

  const rawSubmissionCount = preFiltered.length;
  const duplicateHidden = Math.max(0, rawSubmissionCount - filtered.length);

  const counts = filtered.reduce(
    (acc: any, row) => {
      acc.byCategory[row.project.category] =
        (acc.byCategory[row.project.category] || 0) + 1;
      acc.byStatus[row.status] = (acc.byStatus[row.status] || 0) + 1;
      acc.bySource[row.source] = (acc.bySource[row.source] || 0) + 1;
      const createdAt = new Date(row.lastTouchAt || row.createdAt);
      if (!Number.isNaN(createdAt.getTime())) {
        const date = localDayKey(createdAt);
        const daily = acc.dailyTrend[date] || { date, leads: 0, converted: 0 };
        daily.leads += 1;
        if (row.status === "sale") daily.converted += 1;
        acc.dailyTrend[date] = daily;
      }
      return acc;
    },
    { byCategory: {}, byStatus: {}, bySource: {}, dailyTrend: {} },
  );
  const dailyTrend = Object.values(counts.dailyTrend).sort(
    (first: any, second: any) => first.date.localeCompare(second.date),
  );
  delete counts.dailyTrend;

  const facets = {
    states: [
      ...new Set(normalized.map((row) => row.project.state).filter(Boolean)),
    ].sort(),
    cities: [
      ...new Set(
        normalized
          .filter((row) => !query.state || row.project.state === query.state)
          .map((row) => row.project.city)
          .filter(Boolean),
      ),
    ].sort(),
    localities: [
      ...new Set(
        normalized
          .filter(
            (row) =>
              (!query.state || row.project.state === query.state) &&
              (!query.city || row.project.city === query.city),
          )
          .map((row) => row.project.locality)
          .filter(Boolean),
      ),
    ].sort(),
  };

  return {
    leads: exportAll
      ? filtered
      : filtered.slice((page - 1) * limit, page * limit),
    pagination: {
      page,
      limit,
      total: filtered.length,
      pages: Math.ceil(filtered.length / limit) || 0,
    },
    summary: {
      total: filtered.length,
      rawSubmissions: rawSubmissionCount,
      duplicatesHidden: duplicateHidden,
      ...counts,
      dailyTrend,
    },
    facets,
  };
};
