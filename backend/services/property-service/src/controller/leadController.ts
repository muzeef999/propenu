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
import * as XLSX from "xlsx";


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

  const headers = parseCsvLine(headerLine).map(normalizeCsvHeader);

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
    Object.entries(row).reduce<Record<string, string>>(
      (normalizedRow, [header, value]) => {
        normalizedRow[normalizeCsvHeader(header)] =
          value == null ? "" : String(value).trim();
        return normalizedRow;
      },
      {}
    )
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

const getCombinedProjectLeads = async (query: any) => {
  const [publicLeads, propertyLeads] = await Promise.all([
    PublicLead.find(query).lean(),
    Lead.find(query)
      .select("name phone email status remarks createdAt updatedAt projectId")
      .lean(),
  ]);

  return [...publicLeads, ...propertyLeads].sort(
    (a: any, b: any) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
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

    res.json({
      success: true,
      count: leads.length,
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
        const name = row.name?.trim();
        const phone = row.phone?.trim();
        const email = row.email?.trim();
        const message = row.message?.trim();
        const status = normalizeLeadStatus(row.status) || "new_lead";
        const sourceCreatedAt = row.sourceCreatedAt?.trim();
        const purchaseTimeline = row.purchaseTimeline?.trim();
        const budgetRange = row.budgetRange?.trim();

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
