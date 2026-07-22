import { Request, RequestHandler, Response } from "express";
import {
  assignLead,
  createLead,
  deleteLeadService,
  deleteProjectLeadsService,
  getLeadById,
  getLeads,
  updateLeadStatus,
  updateLeadStatusService,
} from "../services/leadService";
import { LEAD_STATUSES, LeadCreateSchema } from "../zod/leadZod";
import { AuthRequest } from "../middlewares/authMiddleware";
import Lead from "../models/LeadModel";
import { PublicLeadSchemaZ } from "../zod/publicLeadZod";
import { createPublicLead } from "../services/publicLeadService";
import PublicLead from "../models/PublicLead";
import mongoose, { Types } from "mongoose";
import FeaturedProject from "../models/featurePropertiesModel";
import Residential from "../models/residentialModel";
import Commercial from "../models/commercialModel";
import LandPlot from "../models/landModel";
import Agricultural from "../models/agriculturalModel";
import * as XLSX from "xlsx";
import { getAdminLeadDashboard } from "../services/adminLeadService";


const sendCSV = (leads: any[], res: Response) => {
  const header = [
    "Full Name",
    "Phone Number",
    "Email",
    "Lead Created Time",
    "Planning To Purchase",
    "Budget Range",
    "Status",
    "System Date",
  ].join(",") + "\n";

  const csvValue = (value: unknown) => {
    const stringValue = value == null ? "" : String(value);
    if (!/[",\n\r]/.test(stringValue)) return stringValue;
    return `"${stringValue.replace(/"/g, '""')}"`;
  };

  const formatDate = (value?: string | Date) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString("en-IN");
  };

  const rows = leads
    .map(
      (l) =>
        [
          l.name,
          l.phone,
          l.email,
          formatDate(l.sourceCreatedAt),
          l.purchaseTimeline,
          l.budgetRange,
          l.status,
          formatDate(l.createdAt),
        ]
          .map(csvValue)
          .join(",")
    )
    .join("\n");

  const csv = header + rows;

  res.header("Content-Type", "text/csv");
  res.attachment("leads.csv");
  res.send(csv);
};

const csvHeaderAliases: Record<string, string> = {
  full_name: "name",
  fullname: "name",
  contact: "phone",
  contact_number: "phone",
  contactnumber: "phone",
  mobile: "phone",
  mobile_number: "phone",
  mobilenumber: "phone",
  phone_number: "phone",
  phonenumber: "phone",
  created_time: "sourceCreatedAt",
  createdtime: "sourceCreatedAt",
  lead_created_time: "sourceCreatedAt",
  when_are_you_planning_to_purchase: "purchaseTimeline",
  when_are_you_planning_to_purchase_: "purchaseTimeline",
  planning_to_purchase: "purchaseTimeline",
  purchase_timeline: "purchaseTimeline",
  what_is_your_budget_range: "budgetRange",
  what_is_your_budget_range_: "budgetRange",
  budget_range: "budgetRange",
  remarks: "message",
};

const normalizeCsvHeader = (value: string) => {
  const key = value
    .replace(/^\uFEFF/, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return csvHeaderAliases[key] ?? key;
};

const parseCsvLine = (line: string) => {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const nextChar = line[index + 1];

    if (char === '"' && inQuotes && nextChar === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      cells.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  cells.push(current.trim());
  return cells;
};

const parseCsvRows = (buffer: Buffer) => {
  const lines = buffer
    .toString("utf8")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .filter((line) => line.trim().length > 0);

  if (lines.length < 2) return [];

  const headerLine = lines[0];
  if (!headerLine) return [];

  const headers = parseCsvLine(headerLine).map((header) =>
    header.replace(/^\uFEFF/, "").trim()
  );

  return lines.slice(1).map((line) => {
    const cells = parseCsvLine(line);
    return headers.reduce<Record<string, string>>((row, header, index) => {
      row[header] = cells[index]?.trim() ?? "";
      return row;
    }, {});
  });
};

const parseSpreadsheetRows = (buffer: Buffer) => {
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) return [];

  const sheet = workbook.Sheets[firstSheetName];
  if (!sheet) return [];

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
    raw: false,
  });

  return rows.map((row: Record<string, unknown>) =>
    Object.entries(row).reduce<Record<string, string>>((normalizedRow, [header, value]) => {
      normalizedRow[header.trim()] = value == null ? "" : String(value).trim();
      return normalizedRow;
    }, {})
  );
};

const parseLeadImportRows = (file: Express.Multer.File) => {
  const filename = file.originalname.toLowerCase();
  const mimeType = file.mimetype.toLowerCase();
  const isExcel =
    filename.endsWith(".xlsx") ||
    filename.endsWith(".xls") ||
    mimeType.includes("spreadsheet") ||
    mimeType.includes("excel");

  return isExcel ? parseSpreadsheetRows(file.buffer) : parseCsvRows(file.buffer);
};

const normalizeLeadStatus = (value?: string) => {
  const normalized = value?.trim().toLowerCase().replace(/[\s-]+/g, "_");
  const aliases: Record<string, (typeof LEAD_STATUSES)[number]> = {
    new: "new_lead",
    intrested: "interested",
    not_intrested: "not_interested",
    contacted: "interested",
    approved: "interested",
    rejected: "not_interested",
    closed: "sale",
  };
  const status = normalized ? aliases[normalized] ?? normalized : undefined;
  return status && LEAD_STATUSES.includes(status as any)
    ? status
    : undefined;
};

const cleanOptional = (value: unknown) => {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed || undefined;
};

const normalizePublicLeadPayload = (payload: any) => {
  const sourceCreatedAt = cleanOptional(
    payload.sourceCreatedAt ?? payload.created_time
  );

  return {
    projectId: payload.projectId,
    name: cleanOptional(payload.name ?? payload.full_name),
    phone: cleanOptional(payload.phone ?? payload.phone_number),
    email: cleanOptional(payload.email),
    message: cleanOptional(payload.message ?? payload.remarks),
    sourceCreatedAt,
    purchaseTimeline: cleanOptional(
      payload.purchaseTimeline ??
        payload.when_are_you_planning_to_purchase ??
        payload["when_are_you_planning_to_purchase?"]
    ),
    budgetRange: cleanOptional(
      payload.budgetRange ??
        payload.what_is_your_budget_range ??
        payload["what_is_your_budget_range?"]
    ),
    status: normalizeLeadStatus(payload.status),
  };
};

const getProjectLeadQuery = (projectId: string, from?: unknown, to?: unknown) => {
  const query: any = { projectId };

  if (from || to) {
    query.createdAt = {};

    if (from) {
      query.createdAt.$gte = new Date(from as string);
    }

    if (to) {
      const toDate = new Date(to as string);
      toDate.setHours(23, 59, 59, 999);
      query.createdAt.$lte = toDate;
    }
  }

  return query;
};

const VIEW_DURATION_MODEL_MAP: Record<string, any> = {
  featuredprojects: FeaturedProject,
  residentials: Residential,
  commercials: Commercial,
  landplots: LandPlot,
  agriculturals: Agricultural,
};

const resolveLeadUserIds = async (leads: any[]) => {
  const directUserIds = new Set<string>();
  const emails = new Set<string>();
  const phones = new Set<string>();

  leads.forEach((lead: any) => {
    const createdBy = String(lead?.createdBy ?? "").trim();
    const email = String(lead?.email ?? "").trim().toLowerCase();
    const phone = String(lead?.phone ?? "").trim();

    if (createdBy && Types.ObjectId.isValid(createdBy)) {
      directUserIds.add(createdBy);
    }
    if (email) {
      emails.add(email);
    }
    if (phone) {
      phones.add(phone);
    }
  });

  const orMatch: Record<string, unknown>[] = [];

  if (directUserIds.size) {
    orMatch.push({
      _id: {
        $in: Array.from(directUserIds).map((id) => new Types.ObjectId(id)),
      },
    });
  }

  if (emails.size) {
    orMatch.push({ email: { $in: Array.from(emails) } });
  }

  if (phones.size) {
    orMatch.push({ phone: { $in: Array.from(phones) } });
  }

  if (!orMatch.length) {
    return new Map<string, string>();
  }

  const users = await mongoose.connection
    .collection("users")
    .find({ $or: orMatch })
    .project({ _id: 1, email: 1, phone: 1 })
    .toArray();

  const userIdByLookup = new Map<string, string>();
  users.forEach((user) => {
    const userId = String(user._id);
    const email = String(user.email ?? "").trim().toLowerCase();
    const phone = String(user.phone ?? "").trim();

    userIdByLookup.set(`id:${userId}`, userId);
    if (email) userIdByLookup.set(`email:${email}`, userId);
    if (phone) userIdByLookup.set(`phone:${phone}`, userId);
  });

  const resolvedUserIds = new Map<string, string>();

  leads.forEach((lead: any) => {
    const leadId = String(lead._id);
    const createdBy = String(lead?.createdBy ?? "").trim();
    const email = String(lead?.email ?? "").trim().toLowerCase();
    const phone = String(lead?.phone ?? "").trim();

    const resolvedUserId =
      (createdBy && userIdByLookup.get(`id:${createdBy}`)) ||
      (email && userIdByLookup.get(`email:${email}`)) ||
      (phone && userIdByLookup.get(`phone:${phone}`)) ||
      "";

    if (resolvedUserId) {
      resolvedUserIds.set(leadId, resolvedUserId);
    }
  });

  return resolvedUserIds;
};

const attachProjectLeadActivity = async (projectId: string, leads: any[]) => {
  if (!leads.length || !Types.ObjectId.isValid(projectId)) {
    return leads;
  }

  const resolvedUserIds = await resolveLeadUserIds(leads);
  const uniqueUserIds = Array.from(new Set(resolvedUserIds.values()));

  if (!uniqueUserIds.length) {
    return leads.map((lead: any) => ({
      ...lead,
      activity: {
        leadSubmitted: true,
        shortlisted: false,
        brochureDownloaded: false,
        timeSpentMinutes: null,
      },
    }));
  }

  const projectObjectId = new Types.ObjectId(projectId);
  const userObjectIds = uniqueUserIds.map((id) => new Types.ObjectId(id));

  const [shortlistRows, brochureRows, durationRows] = await Promise.all([
    mongoose.connection
      .collection("shortlists")
      .aggregate([
        {
          $match: {
            propertyType: "FeaturedProject",
            propertyId: projectObjectId,
            userId: { $in: userObjectIds },
          },
        },
        {
          $group: {
            _id: "$userId",
          },
        },
      ])
      .toArray(),
    mongoose.connection
      .collection("brochuredownloads")
      .aggregate([
        {
          $match: {
            projectId: projectObjectId,
            source: "brochure_download",
            userId: { $in: userObjectIds },
          },
        },
        {
          $group: {
            _id: "$userId",
          },
        },
      ])
      .toArray(),
    mongoose.connection
      .collection("projectviewdurations")
      .aggregate([
        {
          $match: {
            projectId: projectObjectId,
            userId: { $in: userObjectIds },
          },
        },
        {
          $group: {
            _id: "$userId",
            totalDurationMs: { $sum: { $ifNull: ["$durationMs", 0] } },
          },
        },
      ])
      .toArray(),
  ]);

  const shortlistedUserIds = new Set(shortlistRows.map((row) => String(row._id)));
  const brochureUserIds = new Set(brochureRows.map((row) => String(row._id)));
  const timeSpentByUserId = new Map<string, number>(
    durationRows.map((row) => [
      String(row._id),
      Number(((row.totalDurationMs ?? 0) / 60000).toFixed(1)),
    ]),
  );

  return leads.map((lead: any) => {
    const resolvedUserId = resolvedUserIds.get(String(lead._id)) || "";

    return {
      ...lead,
      activity: {
        leadSubmitted: true,
        shortlisted: resolvedUserId ? shortlistedUserIds.has(resolvedUserId) : false,
        brochureDownloaded: resolvedUserId ? brochureUserIds.has(resolvedUserId) : false,
        timeSpentMinutes: resolvedUserId
          ? timeSpentByUserId.get(resolvedUserId) ?? null
          : null,
      },
    };
  });
};

const getCombinedProjectLeads = async (query: any) => {
  const [publicLeads, propertyLeads] = await Promise.all([
    PublicLead.find(query).lean(),
    Lead.find(query)
      .select("name phone email status remarks createdAt updatedAt projectId createdBy")
      .lean(),
  ]);

  const normalizedPublicLeads = publicLeads.map((lead: any) => ({
    ...lead,
    source: lead.source ?? "site",
  }));

  const normalizedPropertyLeads = propertyLeads.map((lead: any) => ({
    ...lead,
    source: "direct",
  }));

  const combinedLeads = [...normalizedPublicLeads, ...normalizedPropertyLeads].sort(
    (a: any, b: any) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return attachProjectLeadActivity(String(query.projectId), combinedLeads);
};

const buildProjectLeadsHeader = (leads: any[]) => {
  const sourceCounts = leads.reduce(
    (counts, lead: any) => {
      const source = lead?.source;
      if (source === "site") counts.site += 1;
      else if (source === "imported") counts.imported += 1;
      else counts.direct += 1;
      return counts;
    },
    { site: 0, imported: 0, direct: 0 }
  );

  let title = "All Leads";
  let type: "all" | "site" | "imported" | "direct" = "all";

  if (sourceCounts.site > 0 && sourceCounts.imported === 0 && sourceCounts.direct === 0) {
    title = "Leads From Our Site";
    type = "site";
  } else if (sourceCounts.imported > 0 && sourceCounts.site === 0 && sourceCounts.direct === 0) {
    title = "Imported Leads";
    type = "imported";
  } else if (sourceCounts.direct > 0 && sourceCounts.site === 0 && sourceCounts.imported === 0) {
    title = "Direct Leads";
    type = "direct";
  }

  return {
    title,
    type,
    counts: sourceCounts,
  };
};

const standardLeadColumns = [
  { key: "name", label: "Full Name" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone Number" },
  { key: "activity", label: "Activity" },
  { key: "status", label: "Status" },
  { key: "leadTime", label: "Lead Time" },
  { key: "purchaseTimeline", label: "Planning To Purchase" },
  { key: "budgetRange", label: "Budget Range" },
];

const getColumnKeyFromLabel = (label: string) => {
  const normalized = normalizeCsvHeader(label);

  switch (normalized) {
    case "name":
      return "name";
    case "phone":
      return "phone";
    case "email":
      return "email";
    case "status":
      return "status";
    case "sourceCreatedAt":
      return "leadTime";
    case "purchaseTimeline":
      return "purchaseTimeline";
    case "budgetRange":
      return "budgetRange";
    case "message":
      return "message";
    default:
      return `extra:${label}`;
  }
};

const buildProjectLeadColumns = (leads: any[]) => {
  const importedColumnLabels: string[] = [];
  const seenImportedLabels = new Set<string>();

  leads.forEach((lead: any) => {
    const extraFields = lead?.extraFields ?? {};
    Object.keys(extraFields).forEach((label) => {
      if (seenImportedLabels.has(label)) return;
      seenImportedLabels.add(label);
      importedColumnLabels.push(label);
    });
  });

  const columns: Array<{ key: string; label: string }> = [...standardLeadColumns];
  const standardKeys = new Set(columns.map((column) => column.key));
  const importedOnly =
    leads.length > 0 && leads.every((lead: any) => lead.source === "imported");

  if (importedOnly) {
    const importedCanonicalKeys = new Set(
      importedColumnLabels.map((label) => getColumnKeyFromLabel(label))
    );

    const canonicalColumns = standardLeadColumns.filter((column) =>
      importedCanonicalKeys.has(column.key)
    );
    const canonicalKeys = new Set(canonicalColumns.map((column) => column.key));

    importedColumnLabels.forEach((label) => {
      const key = getColumnKeyFromLabel(label);
      if (canonicalKeys.has(key)) return;
      canonicalColumns.push({ key, label });
      canonicalKeys.add(key);
    });

    return canonicalColumns;
  }

  importedColumnLabels.forEach((label) => {
    const key = getColumnKeyFromLabel(label);
    if (standardKeys.has(key)) return;

    columns.push({ key, label });
    standardKeys.add(key);
  });

  return columns;
};

/*** CREATE LEAD */
export const createLeadController: RequestHandler = async (req, res) => {
  try {
    const authReq = req as AuthRequest; // 👈 cast once

    const data = LeadCreateSchema.parse(authReq.body);
    const lead = await createLead(data, authReq.user!.id);

    res.status(201).json({ success: true, data: lead });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/*** ASSIGN LEAD */
export const assignLeadController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Lead ID is required",
      });
    }

    const lead = await assignLead(id, req.body.assignedTo);
    res.json({ success: true, data: lead });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/*** UPDATE LEAD STATUS */
export const updateLeadStatusController = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Lead ID is required",
      });
    }
    const status = normalizeLeadStatus(req.body.status);
    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value",
      });
    }

    const lead = await updateLeadStatus(id, status);
    res.json({ success: true, data: lead });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/*** GET ALL LEADS */
export const getLeadsController = async (req: Request, res: Response) => {
  try {
    const leads = await getLeads(req.query);
    res.json({ success: true, data: leads });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getAdminLeadsController = async (req: Request, res: Response) => {
  try {
    const data = await getAdminLeadDashboard(req.query);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const exportAdminLeadsController = async (req: Request, res: Response) => {
  try {
    const data = await getAdminLeadDashboard(req.query, true);
    const rows = data.leads.map((lead: any) => ({
      "Lead Name": lead.name,
      Phone: lead.phone,
      Email: lead.email,
      "Project / Property": lead.project.title,
      "Property Code": lead.project.code,
      Category: lead.project.category,
      State: lead.project.state,
      City: lead.project.city,
      Locality: lead.project.locality,
      Source: lead.source,
      Status: lead.status,
      "Purchase Timeline": lead.purchaseTimeline,
      "Budget Range": lead.budgetRange,
      Message: lead.message,
      "Created At": new Date(lead.createdAt).toLocaleString("en-IN"),
    }));
    const format = String(req.query.format || "csv").toLowerCase();
    const worksheet = XLSX.utils.json_to_sheet(rows);
    if (format === "xlsx" || format === "excel") {
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Leads");
      const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `attachment; filename="leads-${Date.now()}.xlsx"`);
      return res.send(buffer);
    }
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="leads-${Date.now()}.csv"`);
    return res.send(`\uFEFF${csv}`);
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

/*** GET SINGLE LEAD*/
export const getLeadByIdController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Lead ID is required",
      });
    }

    const lead = await getLeadById(id);
    res.json({ success: true, data: lead });
  } catch (error: any) {
    res.status(404).json({ success: false, message: error.message });
  }
};


// controller/leadController.ts
export const checkLeadController = async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const { projectId } = req.query;

  if (!projectId) {
    return res.status(400).json({ message: "projectId required" });
  }

  const exists = await Lead.exists({
    projectId,
    createdBy: userId,
  });

  res.json({ contacted: !!exists });
};

export const getMyContactedProperties = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const userId = req.user!.id;



    const leads = await Lead.find({ createdBy: userId })
      .populate("projectId")                    // full property
      .populate("ownerId", "name phone email")  // owner details
      .sort({ createdAt: -1 })
      .lean();



    const properties = leads
      .filter((lead: any) => Boolean(lead?.projectId))
      .map((lead: any) => {
      const property = lead.projectId;

      return {
        leadId: lead._id,
        contactedAt: lead.createdAt,

        // 🔥 lead info
        propertyType: lead.propertyType,
        listingType: lead.listingType,

        // 🔥 property info
        propertyId: property?._id,
        slug: property?.slug || null,
        title:
          property?.title ||
          property?.projectName ||
          property?.buildingName ||
          "Property",

        city: property?.city || "",
        locality: property?.locality || "",
        price:
          property?.price ||
          property?.expectedPrice ||
          property?.priceFrom ||
          null,
        priceFrom: property?.priceFrom || null,
        priceTo: property?.priceTo || null,
        heroImage: property?.heroImage || null,
        gallery: property?.gallery?.[0]?.url || null,
        gallerySummary: property?.gallerySummary || [],
        promotion: property?.promotion || null,

        // 🔥 owner info
        owner: {
          id: lead.ownerId?._id,
          name: lead.ownerId?.name,
          phone: lead.ownerId?.phone,
          email: lead.ownerId?.email,
        },
      };
    });

    res.json({
      success: true,
      total: properties.length,
      properties,
    });
  } catch (err) {
    console.error("getMyContactedProperties error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to load contacted properties",
    });
  }
};




export const createPublicLeadController = async (
  req: Request,
  res: Response
) => {
  try {
    const data = PublicLeadSchemaZ.parse(normalizePublicLeadPayload(req.body));
    const lead = await createPublicLead(data);

    res.status(201).json({
      success: true,
      message: "Lead submitted successfully",
      data: lead,
    });
  } catch (err: any) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

export const trackProjectBrochureDownloadController = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const projectId = String(req.params.projectId || "");
    const userId = String(req.user?.id || "");

    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: "projectId is required",
      });
    }

    if (!Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid projectId",
      });
    }

    if (!userId || !Types.ObjectId.isValid(userId)) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    await mongoose.connection.collection("brochuredownloads").insertOne({
      projectId: new Types.ObjectId(projectId),
      userId: new Types.ObjectId(userId),
      source: "brochure_download",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return res.status(201).json({
      success: true,
      message: "Brochure download tracked",
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to track brochure download",
    });
  }
};

export const trackProjectViewDurationController = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const projectId = String(req.params.projectId || "");
    const userId = String(req.user?.id || "");
    const durationMs = Number(req.body?.durationMs ?? 0);
    const pathname = typeof req.body?.pathname === "string" ? req.body.pathname.trim() : "";

    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: "projectId is required",
      });
    }

    if (!Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid projectId",
      });
    }

    if (!userId || !Types.ObjectId.isValid(userId)) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!Number.isFinite(durationMs) || durationMs < 1000) {
      return res.status(400).json({
        success: false,
        message: "durationMs must be at least 1000",
      });
    }

    const project = await FeaturedProject.findById(projectId)
      .select("_id createdBy")
      .lean();

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    await mongoose.connection.collection("projectviewdurations").insertOne({
      projectId: new Types.ObjectId(projectId),
      builderId: project.createdBy,
      userId: new Types.ObjectId(userId),
      durationMs: Math.round(durationMs),
      durationMinutes: Number((durationMs / 60000).toFixed(2)),
      pathname: pathname || null,
      source: "project_view_duration",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return res.status(201).json({
      success: true,
      message: "Project view duration tracked",
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to track project view duration",
    });
  }
};

export const trackPropertyViewDurationController = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const projectId = String(req.params.projectId || "");
    const propertyType = String(req.params.propertyType || "").trim().toLowerCase();
    const userId = String(req.user?.id || "");
    const durationMs = Number(req.body?.durationMs ?? 0);
    const pathname = typeof req.body?.pathname === "string" ? req.body.pathname.trim() : "";

    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: "projectId is required",
      });
    }

    if (!Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid projectId",
      });
    }

    if (!userId || !Types.ObjectId.isValid(userId)) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!Number.isFinite(durationMs) || durationMs < 1000) {
      return res.status(400).json({
        success: false,
        message: "durationMs must be at least 1000",
      });
    }

    const PropertyModel = VIEW_DURATION_MODEL_MAP[propertyType];
    if (!PropertyModel || propertyType === "featuredprojects") {
      return res.status(400).json({
        success: false,
        message: "Invalid propertyType",
      });
    }

    const property = await PropertyModel.findById(projectId)
      .select("_id createdBy")
      .lean();

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found",
      });
    }

    await mongoose.connection.collection("projectviewdurations").insertOne({
      projectId: new Types.ObjectId(projectId),
      ownerId: property.createdBy,
      userId: new Types.ObjectId(userId),
      propertyType,
      durationMs: Math.round(durationMs),
      durationMinutes: Number((durationMs / 60000).toFixed(2)),
      pathname: pathname || null,
      source: "property_view_duration",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return res.status(201).json({
      success: true,
      message: "Property view duration tracked",
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to track property view duration",
    });
  }
};


export const getProjectLeadsController = async (
  req: Request,
  res: Response
) => {
  try {
    const projectId = req.params.projectId;
    const { from, to } = req.query;

    if (!projectId) {
      return res.status(400).json({ message: "projectId is required" });
    }

    if (!Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ message: "Invalid projectId" });
    }

    const query = getProjectLeadQuery(projectId, from, to);
    const leads = await getCombinedProjectLeads(query);
    const header = buildProjectLeadsHeader(leads);
    const columns = buildProjectLeadColumns(leads);

    res.json({
      success: true,
      count: leads.length,
      header,
      columns,
      data: leads,
    });

  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const updateProjectLeadStatusController = async (
  req: Request,
  res: Response
) => {
  try {
    const id = req.params.id;
    const { status } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Lead ID is required",
      });
    }

    const normalizedStatus = normalizeLeadStatus(status);

    if (!normalizedStatus) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value",
      });
    }

    const updatedLead = await updateLeadStatusService(id, normalizedStatus);

    res.json({
      success: true,
      data: updatedLead,
      message: "Lead status updated",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteLeadController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Lead ID is required",
      });
    }

    await deleteLeadService(id);

    res.json({
      success: true,
      message: "Lead deleted successfully",
    });
  } catch (error: any) {
    const statusCode =
      error?.message === "Lead not found"
        ? 404
        : error?.message === "Invalid Lead ID"
          ? 400
          : 500;

    res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteProjectLeadsController = async (
  req: Request,
  res: Response
) => {
  try {
    const { projectId } = req.params;

    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: "projectId is required",
      });
    }

    const result = await deleteProjectLeadsService(projectId);

    res.json({
      success: true,
      message: "Project leads deleted successfully",
      data: result,
    });
  } catch (error: any) {
    const statusCode = error?.message === "Invalid projectId" ? 400 : 500;

    res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};


export const downloadLeadsCSVController = async (
  req: Request,
  res: Response
) => {
  try {
    const projectId = req.params.projectId;
    const { from, to } = req.query;

    if (!projectId) {
      return res.status(400).json({ message: "projectId required" });
    }

    if (!Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ message: "Invalid projectId" });
    }

    const query = getProjectLeadQuery(projectId, from, to);
    const leads = await getCombinedProjectLeads(query);

    return sendCSV(leads, res);

  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const importProjectLeadsCSVController = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { projectId } = req.params;
    const file = req.file;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!projectId) {
      return res.status(400).json({ success: false, message: "projectId required" });
    }

    if (!Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ success: false, message: "Invalid projectId" });
    }

    if (!file) {
      return res.status(400).json({ success: false, message: "CSV file is required" });
    }

    const project = await FeaturedProject.findById(projectId)
      .select("createdBy")
      .lean();

    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    interface CsvRow {
      [key: string]: string;
    }

    interface NormalizedLeadRow {
      projectId: string;
      name: string;
      phone: string;
      email?: string;
      message?: string;
      source: "imported";
      extraFields: Record<string, string>;
      sourceCreatedAt?: string;
      purchaseTimeline?: string;
      budgetRange?: string;
      status: string;
    }

    interface LeadImportError {
      row: number;
      message: string;
    }

    interface LeadPhoneRecord {
      phone: string;
    }

    const rows = parseLeadImportRows(file);
    const errors: LeadImportError[] = [];
    const allowedStatuses = new Set<string>(LEAD_STATUSES);
    const seenPhones = new Set<string>();

    const normalizedRows = rows.flatMap(
      (row: CsvRow, index: number): NormalizedLeadRow[] => {
        const rowNumber = index + 2;
        const normalizedRow = Object.entries(row).reduce<Record<string, string>>(
          (result, [header, value]) => {
            result[normalizeCsvHeader(header)] = value?.trim() ?? "";
            return result;
          },
          {}
        );
        const name = normalizedRow.name?.trim();
        const phone = normalizedRow.phone?.trim();
        const email = normalizedRow.email?.trim();
        const message = normalizedRow.message?.trim();
        const status = normalizeLeadStatus(normalizedRow.status) || "new_lead";
        const sourceCreatedAt = normalizedRow.sourceCreatedAt?.trim();
        const purchaseTimeline = normalizedRow.purchaseTimeline?.trim();
        const budgetRange = normalizedRow.budgetRange?.trim();

        if (!name || name.length < 2) {
          errors.push({ row: rowNumber, message: "Name is required" });
          return [];
        }

        if (!phone || phone.length < 6) {
          errors.push({ row: rowNumber, message: "Phone is required" });
          return [];
        }

        if (!allowedStatuses.has(status)) {
          errors.push({ row: rowNumber, message: "Invalid status" });
          return [];
        }

        if (seenPhones.has(phone)) {
          errors.push({ row: rowNumber, message: "Duplicate phone in CSV" });
          return [];
        }

        seenPhones.add(phone);

        return [
          {
            projectId,
            name,
            phone,
            email: email || "",
            message: message || "",
            source: "imported",
            extraFields: row,
            sourceCreatedAt: sourceCreatedAt || "",
            purchaseTimeline: purchaseTimeline || "",
            budgetRange: budgetRange || "",
            status,
          },
        ];
      }
    );

    if (!normalizedRows.length) {
      return res.status(400).json({
        success: false,
        message: "No valid leads found in CSV",
        totalRows: rows.length,
        imported: 0,
        skipped: rows.length,
        errors,
      });
    }

    const importedPhones = normalizedRows.map((row: NormalizedLeadRow) => row.phone);
    const [existingPublicLeads, existingPropertyLeads]: [LeadPhoneRecord[], LeadPhoneRecord[]] =
      await Promise.all([
        PublicLead.find({
          projectId,
          phone: { $in: importedPhones },
        })
          .select("phone")
          .lean(),
        Lead.find({
          projectId,
          phone: { $in: importedPhones },
        })
          .select("phone")
          .lean(),
      ]);

    const existingPhones = new Set([
      ...existingPublicLeads.map((lead) => lead.phone),
      ...existingPropertyLeads.map((lead) => lead.phone),
    ]);
    const leadsToInsert = normalizedRows.filter((row: NormalizedLeadRow) => {
      if (!existingPhones.has(row.phone)) return true;
      errors.push({ row: 0, message: `Skipped existing phone ${row.phone}` });
      return false;
    });

    if (leadsToInsert.length) {
      await PublicLead.insertMany(leadsToInsert, { ordered: false });
    }

    res.status(201).json({
      success: true,
      message: "Leads imported successfully",
      totalRows: rows.length,
      imported: leadsToInsert.length,
      skipped: rows.length - leadsToInsert.length,
      errors,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err.message || "Failed to import leads",
    });
  }
};
