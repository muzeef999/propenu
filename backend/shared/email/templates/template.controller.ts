import { Request, Response } from "express";
import { Types } from "mongoose";
import User from "../../../services/user-service/src/models/userModel";
import { renderTemplate } from "../../notifications/templateEngine";
import EmailTemplate from "./template.model";
import { emailQueue } from "../../../services/user-service/src/queues/email.queue";
import { EmailLog } from "../../../services/user-service/src/logs/emailLog.model";
import csv from "csv-parser";
import { parseTemplate } from "../../../services/user-service/src/utils/parseTemplate";
import { Readable } from "stream";
import { whatsappQueue } from "../../../services/user-service/src/queues";
import { WhatsAppLog } from "../../../services/user-service/src/logs/whatsappLog.model";
import { getTemplatesService } from "../../whatsapp/templates/whatsappTemplate.service";
import * as XLSX from "xlsx";

function getCsvUploadFile(req: Request): Express.Multer.File | undefined {
  const files = req.files as
    | { [fieldname: string]: Express.Multer.File[] }
    | Express.Multer.File[]
    | undefined;

  if (Array.isArray(files)) return files[0];
  if (files && typeof files === "object") {
    return files.file?.[0] || files.csv?.[0];
  }
  return req.file;
}

function pickPhone(row: Record<string, string>): string {
  const keys = Object.keys(row);
  const phoneKey = keys.find((k) =>
    /^(phone|mobile|whatsapp|wa[_-]?id|msisdn)$/i.test(k.trim()),
  );
  return String(phoneKey ? row[phoneKey] : "").trim();
}

function countTemplateVars(text = ""): number {
  const matches = String(text).match(/\{\{\d+\}\}/g);
  return matches ? matches.length : 0;
}

/** Map CSV row → template body variables ({{1}}, {{2}}, …). */
function buildCsvVariables(
  row: Record<string, string>,
  expectedCount?: number,
): string[] {
  const numbered: string[] = [];
  for (let i = 1; i <= 15; i++) {
    const key = Object.keys(row).find((k) =>
      new RegExp(`^(var\\s*${i}|\\{\\{${i}\\}\\}|param\\s*${i})$`, "i").test(
        k.trim(),
      ),
    );
    if (!key) break;
    numbered.push(String(row[key] ?? "").trim() || `Customer`);
  }

  let values = numbered;
  if (!values.length) {
    const skip = /^(phone|mobile|whatsapp|wa[_-]?id|msisdn|email)$/i;
    values = [];
    for (const [k, v] of Object.entries(row)) {
      if (skip.test(k.trim())) continue;
      const text = String(v ?? "").trim();
      if (text) values.push(text);
    }
  }

  if (typeof expectedCount === "number" && expectedCount >= 0) {
    if (expectedCount === 0) return [];
    return Array.from({ length: expectedCount }, (_, i) => {
      const v = values[i];
      return v != null && String(v).trim() ? String(v).trim() : "Customer";
    });
  }

  return values.length ? values : ["Customer"];
}

function parseDelimitedBuffer(
  buffer: Buffer,
  separator = ",",
): Promise<Record<string, string>[]> {
  return new Promise((resolve, reject) => {
    const rows: Record<string, string>[] = [];
    Readable.from(buffer)
      .pipe(csv({ separator }))
      .on("data", (data: Record<string, string>) => rows.push(data))
      .on("end", () => resolve(rows))
      .on("error", reject);
  });
}

async function parseContactFile(
  file: Express.Multer.File,
): Promise<Record<string, string>[]> {
  const extension = file.originalname.toLowerCase().split(".").pop();

  if (["xlsx", "xls", "xlsm", "ods"].includes(extension || "")) {
    const workbook = XLSX.read(file.buffer, { type: "buffer" });
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) return [];

    const sheet = workbook.Sheets[firstSheetName];
    if (!sheet) return [];

    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: "",
      raw: false,
    });

    return rows.map((row) =>
      Object.fromEntries(
        Object.entries(row).map(([key, value]) => [key.trim(), String(value)]),
      ),
    );
  }

  return parseDelimitedBuffer(file.buffer, extension === "tsv" ? "\t" : ",");
}

// ---------------- CREATE ----------------
export const createEmailTemplate = async (req: Request, res: Response) => {
  try {
    const template = await EmailTemplate.create(req.body);

    res.status(201).json({
      success: true,
      data: template,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ---------------- GET ALL ----------------
export const getAllTemplates = async (req: Request, res: Response) => {
  try {
    const templates = await EmailTemplate.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      data: templates,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// ---------------- GET ONE ----------------
export const getTemplateById = async (
  req: Request<{ id: string }>,
  res: Response,
) => {
  const { id } = req.params;

  if (!Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid template ID",
    });
  }

  const template = await EmailTemplate.findById(id);

  if (!template) {
    return res.status(404).json({
      success: false,
      message: "Template not found",
    });
  }

  res.json({ success: true, data: template });
};

// ---------------- UPDATE ----------------
export const updateTemplate = async (
  req: Request<{ id: string }>,
  res: Response,
) => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid ID" });
    }

    const template = await EmailTemplate.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!template) {
      return res.status(404).json({ message: "Template not found" });
    }

    res.json({ success: true, data: template });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// ---------------- DELETE ----------------
export const deleteTemplate = async (
  req: Request<{ id: string }>,
  res: Response,
) => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid ID" });
    }

    await EmailTemplate.findByIdAndDelete(id);

    res.json({
      success: true,
      message: "Deleted successfully",
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// ---------------- SEND EMAIL ----------------
export const sendTemplateToUsers = async (req: Request, res: Response) => {
  try {
    // ✅ Fix for uuid (CommonJS + ESM issue)
    const { v4: uuidv4 } = await import("uuid");

    const campaignId = uuidv4();

    const { slug, city, state, roleId } = req.body;

    console.log("🚀 Campaign started:", campaignId);

    // ✅ Validation
    if (!slug) {
      return res.status(400).json({
        success: false,
        message: "Slug is required",
      });
    }

    // ✅ Get template
    const template = await EmailTemplate.findOne({
      slug,
      status: "active",
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        message: "Template not found",
      });
    }

    // ✅ Build filter
    const filter: any = {
      isActive: true,
      email: { $exists: true, $ne: null },
    };

    if (city) filter.city = city;
    if (state) filter.state = state;

    if (roleId && Types.ObjectId.isValid(roleId)) {
      filter.roleId = new Types.ObjectId(roleId);
    }

    // ✅ BATCH PROCESSING (NO LIMIT ❌ → SAFE LOOP ✅)
    const batchSize = 100;
    let page = 0;
    let totalUsers = 0;

    while (true) {
      const users = await User.find(filter)
        .select("name email city state")
        .skip(page * batchSize)
        .limit(batchSize)
        .lean();

      if (!users.length) break;

      console.log(`📦 Processing batch ${page + 1} (${users.length} users)`);

      // ✅ Parallel queue add (FAST ⚡)
      for (const user of users) {
        if (!user.email) continue;

        const data = {
          name: user.name || "User",
          city: user.city || "",
          state: user.state || "",
        };

        const subject = renderTemplate(template.subject, data);
        const html = renderTemplate(template.content, data);

        const log = await EmailLog.create({
          campaignId,
          to: user.email,
          subject,
          status: "pending",
        });

        await emailQueue.add(
          "send-email",
          {
            campaignId,
            to: user.email,
            subject,
            html,
            logId: log._id.toString(),
          },
          {
            attempts: 3,
            backoff: {
              type: "exponential",
              delay: 5000,
            },
          },
        );

        // ✅ VERY IMPORTANT (anti-block)
        await new Promise((r) => setTimeout(r, 500)); // 500ms delay
      }

      totalUsers += users.length;
      page++;
    }

    console.log("✅ Campaign queued:", totalUsers, "users");

    // ✅ Final response
    return res.json({
      success: true,
      campaignId,
      totalUsers,
      message: "Emails queued successfully",
    });
  } catch (error: any) {
    console.error("❌ Campaign error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ---------------- CAMPAIGN STATUS ----------------
export const sendEmailCampaignStatus = async (req: Request, res: Response) => {
  try {
    const { campaignId } = req.query;

    const jobs = await emailQueue.getJobs([
      "waiting",
      "active",
      "completed",
      "failed",
    ]);

    // 🟢 CASE 1: Specific campaign
    if (campaignId) {
      let waiting = 0;
      let active = 0;
      let completed = 0;
      let failed = 0;

      for (const job of jobs) {
        if (job.data.campaignId !== campaignId) continue;

        if (job.failedReason) failed++;
        else if (job.finishedOn) completed++;
        else if (job.processedOn) active++;
        else waiting++;
      }

      const total = waiting + active + completed + failed;

      const progress =
        total === 0 ? 0 : Number(((completed / total) * 100).toFixed(2));

      return res.json({
        success: true,
        data: {
          campaignId,
          total,
          waiting,
          processing: active,
          completed,
          failed,
          progress: `${progress}%`,
          lastUpdated: new Date().toISOString(),
        },
      });
    }

    // 🔵 CASE 2: ALL campaigns summary
    const campaignMap: any = {};

    for (const job of jobs) {
      const id = job.data.campaignId;
      if (!id) continue;

      if (!campaignMap[id]) {
        campaignMap[id] = {
          campaignId: id,
          waiting: 0,
          active: 0,
          completed: 0,
          failed: 0,
        };
      }

      if (job.failedReason) campaignMap[id].failed++;
      else if (job.finishedOn) campaignMap[id].completed++;
      else if (job.processedOn) campaignMap[id].active++;
      else campaignMap[id].waiting++;
    }

    const result = Object.values(campaignMap).map((c: any) => {
      const total = c.waiting + c.active + c.completed + c.failed;

      const progress =
        total === 0 ? 0 : Number(((c.completed / total) * 100).toFixed(2));

      return {
        ...c,
        total,
        processing: c.active,
        progress: `${progress}%`,
      };
    });

    return res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error("❌ Status error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch campaign status",
    });
  }
};

// ---------------- SEND CSV BULK EMAIL ----------------
export const sendCsvBulkEmail = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const { templateId } = req.body as { templateId?: string };

    // ✅ validations
    if (!req.file) {
      return res.status(400).json({ message: "CSV file required" });
    }

    if (!templateId) {
      return res.status(400).json({ message: "templateId required" });
    }

    const template = await EmailTemplate.findById(templateId);

    if (!template) {
      return res.status(404).json({ message: "Template not found" });
    }

    // Create one campaign ID for the entire upload.
    const campaignId = "csv_" + Date.now();
    const rows = await parseContactFile(req.file);
    let jobCount = 0;
    let skipped = 0;

    for (const row of rows) {
      const emailKey = Object.keys(row).find(
        (key) => key.trim().toLowerCase() === "email",
      );
      const email = String(emailKey ? row[emailKey] : "").trim();

      if (!email) {
        skipped += 1;
        continue;
      }

      const subject = parseTemplate(template.subject || "", row);
      const html = parseTemplate(template.content || "", row);
      const log = await EmailLog.create({
        to: email,
        subject,
        html,
        status: "pending",
        campaignId,
      });

      await emailQueue.add(
        "send-email",
        {
          to: email,
          subject,
          html,
          logId: String(log._id),
          campaignId,
        },
        { delay: jobCount * 2000 },
      );

      jobCount += 1;
    }

    return res.status(200).json({
      message: "Email campaign queued successfully",
      totalJobs: jobCount,
      skipped,
      campaignId,
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";

    return res.status(500).json({
      message: "Something went wrong",
      error: errorMessage,
    });
  }
};

// ---------------- SEND BULK WHATSAPP ----------------
export const sendWhatsAppCSV = async (req: Request, res: Response) => {
  try {
    const file = getCsvUploadFile(req);

    if (!file?.buffer) {
      return res.status(400).json({
        success: false,
        message: "CSV file is required",
      });
    }

    const templateName = String(req.body?.templateName || "").trim();
    if (!templateName) {
      return res.status(400).json({
        success: false,
        message: "templateName is required",
      });
    }

    const sendMode = String(req.body?.sendMode || "now").toLowerCase();
    const scheduleAtRaw = req.body?.scheduleAt
      ? new Date(req.body.scheduleAt)
      : null;
    const scheduleValid =
      scheduleAtRaw instanceof Date && !Number.isNaN(scheduleAtRaw.getTime());
    const baseDelayMs =
      sendMode === "schedule" && scheduleValid
        ? Math.max(0, scheduleAtRaw!.getTime() - Date.now())
        : 0;

    const results = await parseContactFile(file);
    console.log("📄 CSV parsed:", results.length);

    if (!results.length) {
      return res.status(400).json({
        success: false,
        message: "CSV has no data rows",
      });
    }

    // Resolve Meta template once — language + exact body var count
    const templatesRes = await getTemplatesService();
    const metaTemplate = (templatesRes?.data || []).find(
      (t: any) =>
        String(t.name || "")
          .toLowerCase()
          .trim() === templateName.toLowerCase(),
    );

    if (!metaTemplate) {
      return res.status(404).json({
        success: false,
        message: `Template "${templateName}" not found on Meta`,
      });
    }

    const templateStatus = String(metaTemplate.status || "").toUpperCase();
    if (templateStatus && templateStatus !== "APPROVED") {
      return res.status(400).json({
        success: false,
        message: `Template "${metaTemplate.name}" is ${templateStatus}. Only APPROVED templates can be sent.`,
      });
    }

    const bodyComp = (metaTemplate.components || []).find(
      (c: any) => String(c.type || "").toUpperCase() === "BODY",
    );
    const headerComp = (metaTemplate.components || []).find(
      (c: any) => String(c.type || "").toUpperCase() === "HEADER",
    );
    const expectedVars = countTemplateVars(bodyComp?.text || "");
    const language =
      typeof metaTemplate.language === "string"
        ? metaTemplate.language
        : metaTemplate.language?.code || "en";
    const category = String(metaTemplate.category || "MARKETING").toUpperCase();
    const headerFormat = String(headerComp?.format || "").toUpperCase();
    const headerImageUrl = String(req.body?.headerImageUrl || "").trim();

    if (
      ["IMAGE", "VIDEO", "DOCUMENT"].includes(headerFormat) &&
      !headerImageUrl.startsWith("http")
    ) {
      return res.status(400).json({
        success: false,
        message: `Template "${metaTemplate.name}" requires a public ${headerFormat} header URL (S3/CDN). Local image upload is preview-only.`,
      });
    }

    const campaignId = `wa_csv_${Date.now()}`;
    let total = 0;
    let skipped = 0;

    for (const row of results) {
      const phoneRaw = pickPhone(row);
      if (!phoneRaw) {
        skipped += 1;
        continue;
      }

      const phone = phoneRaw.replace(/\D/g, "");
      if (phone.length < 10) {
        skipped += 1;
        continue;
      }

      const formattedPhone = phone.startsWith("91") ? phone : `91${phone}`;
      const variables = buildCsvVariables(row, expectedVars);

      const whatsappPayload = {
        to: formattedPhone,
        templateName: metaTemplate.name,
        variables,
        language,
        ...(headerImageUrl ? { headerImageUrl } : {}),
        logId: "",
        campaignId,
      };

      const log = await WhatsAppLog.create({
        to: formattedPhone,
        templateName: metaTemplate.name,
        status: "pending",
        campaignId,
        variables,
        language,
        category,
        ...(headerImageUrl ? { headerImageUrl } : {}),
      });

      whatsappPayload.logId = String(log._id);

      await whatsappQueue.add(
        "send-message",
        whatsappPayload,
        {
          attempts: 3,
          backoff: { type: "exponential", delay: 5000 },
          delay: baseDelayMs + total * 300,
        },
      );

      total += 1;
    }

    if (!total) {
      return res.status(400).json({
        success: false,
        message:
          "No valid phone numbers found. Include a phone/mobile column in the CSV.",
        skipped,
        campaignId,
      });
    }

    return res.json({
      success: true,
      total,
      skipped,
      campaignId,
      message:
        sendMode === "schedule"
          ? "CSV WhatsApp campaign scheduled"
          : "CSV WhatsApp campaign queued",
    });
  } catch (error: any) {
    console.error("❌ CSV Error:", error);

    return res.status(500).json({
      success: false,
      message: error?.message || "CSV WhatsApp campaign failed",
    });
  }
};
