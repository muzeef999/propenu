import axios from "axios";
import { Request, Response } from "express";
import { Types } from "mongoose";

import {
  whatsappQueue,
  addWhatsAppJobWithTimeout,
} from "../../../services/user-service/src/queues";
import User from "../../../services/user-service/src/models/userModel";
import Role from "../../../services/user-service/src/models/roleModel";
import { WhatsAppLog } from "../../../services/user-service/src/logs/whatsappLog.model";
import { WhatsAppCampaignRun } from "../../../services/user-service/src/logs/whatsappCampaignRun.model";

const TOKEN =
  "EAAXhIccvVfgBQvEc8BR5zh8DSyeEfvY9ZCoQHrIG7a8zRBHkN2kfKuUHujlpo31J1oZBfwCNM9DlXpXhQuoubdcAhLmhahYj2LdgQ8iTYytWMK6HMghwHZCxaNSLEhZBrvD3r9ZA6ZCRnJmStnLhoflMLt2szXvyW3fmC507UKfLFX3RCvSbFpAjYut2Avw1rQUgZDZD";
const BUSINESS_ID = "1519313212465013";
const PHONE_ID = "935750846293139";



interface SendWhatsAppInput {
  to: string;
  templateName: string;
  variables: string[];
  language?: string;
  /** Public HTTPS URL (S3/CDN). Do not pass Meta scontent sample URLs as link. */
  headerImageUrl?: string;
  /** Preferred for IMAGE/VIDEO/DOCUMENT headers — from POST /{phone-number-id}/media */
  headerMediaId?: string;
  /** IMAGE | VIDEO | DOCUMENT — avoids Meta template list fetch per message */
  headerFormat?: string;
}

function resolveMetaAuth() {
  return {
    token: process.env.WHATSAPP_TOKEN || TOKEN,
    phoneId: process.env.WHATSAPP_PHONE_NUMBER_ID || PHONE_ID,
    businessId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || BUSINESS_ID,
    apiVersion: process.env.WHATSAPP_API_VERSION || "v19.0",
  };
}

function templateLanguageCode(template: any, fallback = "en"): string {
  const raw = template?.language;
  if (typeof raw === "string" && raw.trim()) return raw.trim();
  if (raw?.code) return String(raw.code).trim();
  return fallback;
}

function alignVariables(variables: string[] = [], count: number): string[] {
  if (count <= 0) return [];
  return Array.from({ length: count }, (_, i) => {
    const v = variables[i];
    const text = v != null ? String(v).trim() : "";
    return text || `Customer`;
  });
}

async function resolveTemplateForSend(templateName: string) {
  const templatesRes = await getTemplatesService();
  const templates = templatesRes?.data || [];
  const template = templates.find(
    (t: any) =>
      String(t.name || "")
        .toLowerCase()
        .trim() === String(templateName).toLowerCase().trim(),
  );
  if (!template) {
    throw new Error(
      `Template "${templateName}" was not found on Meta. Check the name in WhatsApp Manager.`,
    );
  }
  const status = String(template.status || "").toUpperCase();
  if (status && status !== "APPROVED") {
    throw new Error(
      `Template "${template.name}" is ${status}. Only APPROVED templates can be sent.`,
    );
  }
  return template;
}

// CREATE TEMPLATE
export const createTemplateService = async (data: any) => {
  const { token, businessId, apiVersion } = resolveMetaAuth();
  const res = await axios.post(
    `https://graph.facebook.com/${apiVersion}/${businessId}/message_templates`,
    data,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
  );

  return res.data;
};

// GET ALL TEMPLATES
export const getTemplatesService = async () => {
  const { token, businessId, apiVersion } = resolveMetaAuth();
  const res = await axios.get(
    `https://graph.facebook.com/${apiVersion}/${businessId}/message_templates`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params: {
        fields: "name,status,category,language,components",
        limit: 250,
      },
      timeout: 20000,
    },
  );
  return res.data;
};

// DELETE TEMPLATE
export const deleteTemplateService = async (name: string) => {
  const { token, businessId, apiVersion } = resolveMetaAuth();
  const res = await axios.delete(
    `https://graph.facebook.com/${apiVersion}/${businessId}/message_templates`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params: { name },
      timeout: 20000,
    },
  );

  return res.data;
};

const getVariableCount = (text: string): number => {
  const matches = text.match(/{{\d+}}/g);
  return matches ? matches.length : 0;
};

function resolveHeaderFormat(template: any): string {
  const header = (template?.components || []).find(
    (c: any) => String(c.type || "").toUpperCase() === "HEADER",
  );
  return String(header?.format || "").toUpperCase();
}

/**
 * Meta stores the create-time sample as example.header_handle.
 * On GET templates that is often an https://scontent.whatsapp.net preview URL —
 * good for UI preview, NOT valid as Messages API image.link (Meta returns 131053/403).
 */
export function resolveTemplateHeaderMediaUrl(template: any): string {
  const header = (template?.components || []).find(
    (c: any) => String(c.type || "").toUpperCase() === "HEADER",
  );
  if (!header) return "";
  const candidates = [
    header?.example?.header_handle?.[0],
    header?.example?.header_url?.[0],
    header?.example?.header_handle,
    header?.example?.header_url,
  ];
  for (const raw of candidates) {
    const url = String(raw || "").trim();
    if (/^https?:\/\//i.test(url)) return url;
  }
  return "";
}

function isMetaHostedMediaUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return (
      host.includes("scontent") ||
      host.includes("lookaside.fbsbx.com") ||
      host.includes("fbcdn.net") ||
      host.endsWith("whatsapp.net")
    );
  } catch {
    return false;
  }
}

function mimeForHeaderFormat(format: string, detected?: string): string {
  const d = String((detected || "").split(";")[0] || "")
    .trim()
    .toLowerCase();
  if (d.startsWith("image/") || d.startsWith("video/") || d.startsWith("application/")) {
    return d;
  }
  const f = String(format || "").toUpperCase();
  if (f === "VIDEO") return "video/mp4";
  if (f === "DOCUMENT") return "application/pdf";
  return "image/jpeg";
}

function fileNameForMime(mime: string, format: string): string {
  if (mime.includes("png")) return "header.png";
  if (mime.includes("webp")) return "header.webp";
  if (mime.includes("mp4")) return "header.mp4";
  if (mime.includes("pdf")) return "header.pdf";
  const f = String(format || "").toUpperCase();
  if (f === "VIDEO") return "header.mp4";
  if (f === "DOCUMENT") return "header.pdf";
  return "header.jpg";
}

async function downloadMediaBytes(
  url: string,
): Promise<{ buffer: Buffer; mimeType: string }> {
  const { token } = resolveMetaAuth();
  const headers: Record<string, string> = {
    "User-Agent": "PropenuWhatsAppCampaign/1.0",
  };
  // Meta CDN sample URLs usually require the Graph access token.
  if (isMetaHostedMediaUrl(url) && token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await axios.get(url, {
    responseType: "arraybuffer",
    headers,
    timeout: 60000,
    maxRedirects: 5,
  });

  const mimeType = mimeForHeaderFormat(
    "IMAGE",
    String(res.headers["content-type"] || ""),
  );
  return { buffer: Buffer.from(res.data), mimeType };
}

/** Upload binary to WhatsApp Cloud Media API → media id for template header send. */
async function uploadMediaToWhatsApp(opts: {
  buffer: Buffer;
  mimeType: string;
  fileName: string;
}): Promise<string> {
  const { token, phoneId, apiVersion } = resolveMetaAuth();
  if (!token || !phoneId) {
    throw new Error("WhatsApp credentials missing for media upload");
  }

  const form = new FormData();
  form.append("messaging_product", "whatsapp");
  form.append("type", opts.mimeType);
  form.append(
    "file",
    new Blob([new Uint8Array(opts.buffer)], { type: opts.mimeType }),
    opts.fileName,
  );

  const res = await axios.post(
    `https://graph.facebook.com/${apiVersion}/${phoneId}/media`,
    form,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
      timeout: 120000,
    },
  );

  const id = String(res.data?.id || "").trim();
  if (!id) {
    throw new Error("Meta media upload did not return an id");
  }
  return id;
}

/**
 * Meta cannot fetch scontent/lookaside sample URLs as image.link.
 * Re-upload those to Cloud Media API and send with media id instead.
 */
async function prepareHeaderMediaForSend(opts: {
  format: string;
  url?: string;
  mediaId?: string;
}): Promise<{ link?: string; id?: string }> {
  const existingId = String(opts.mediaId || "").trim();
  if (existingId) return { id: existingId };

  const url = String(opts.url || "").trim();
  if (!/^https?:\/\//i.test(url)) {
    throw new Error(
      `This template needs a public ${opts.format} URL or Meta media id for the header.`,
    );
  }

  if (!isMetaHostedMediaUrl(url)) {
    return { link: url };
  }

  console.log(
    "🔄 Template sample is Meta CDN — uploading to WhatsApp Media API for send…",
  );
  const { buffer, mimeType } = await downloadMediaBytes(url);
  const mime = mimeForHeaderFormat(opts.format, mimeType);
  const id = await uploadMediaToWhatsApp({
    buffer,
    mimeType: mime,
    fileName: fileNameForMime(mime, opts.format),
  });
  console.log("✅ WhatsApp media id ready:", id);
  return { id };
}

/**
 * Shared by CRM + CSV campaigns: use upload/paste URL, else Meta create-time sample,
 * then convert Meta CDN samples to media id before queueing.
 */
export async function resolveCampaignHeaderMedia(opts: {
  template: any;
  requestedUrl?: string;
}): Promise<{
  format: string;
  sourceUrl: string;
  headerImageUrl?: string;
  headerMediaId?: string;
}> {
  const format = resolveHeaderFormat(opts.template);
  if (!["IMAGE", "VIDEO", "DOCUMENT"].includes(format)) {
    return { format, sourceUrl: "" };
  }

  const requested = String(opts.requestedUrl || "").trim();
  const sourceUrl =
    (requested.startsWith("http") ? requested : "") ||
    resolveTemplateHeaderMediaUrl(opts.template);

  if (!sourceUrl.startsWith("http")) {
    throw new Error(
      `Template "${opts.template?.name || ""}" requires a public ${format} header URL. Meta sample is missing — upload or paste an S3/CDN image.`,
    );
  }

  const prepared = await prepareHeaderMediaForSend({
    format,
    url: sourceUrl,
  });

  if (prepared.id) {
    return {
      format,
      sourceUrl,
      headerMediaId: prepared.id,
      headerImageUrl: sourceUrl,
    };
  }

  return {
    format,
    sourceUrl,
    headerImageUrl: prepared.link || sourceUrl,
  };
}

/** Build body vars from user profile in stable order matching {{1}}, {{2}}, … */
function buildCampaignVariables(
  user: {
    name?: string;
    city?: string;
    state?: string;
    locality?: string;
    email?: string;
  },
  variableCount: number,
): string[] {
  if (variableCount <= 0) return [];
  const pool = [
    user.name || "User",
    user.city || "",
    user.state || "",
    user.locality || "",
    user.email || "",
  ];
  return Array.from({ length: variableCount }, (_, i) => {
    const text = String(pool[i] ?? "").trim();
    return text || "Customer";
  });
}

export const sendWhatsAppCampaignDynamic = async (
  req: Request,
  res: Response,
) => {
  try {
    const { v4: uuidv4 } = await import("uuid");
    const campaignId = uuidv4();
    const {
      templateName,
      city,
      state,
      locality,
      roleId,
      roleName,
      module: moduleId,
      recipientField,
      headerImageUrl: headerImageUrlRaw,
    } = req.body;

    if (!templateName) {
      return res.status(400).json({
        success: false,
        message: "templateName is required",
      });
    }

    const requestedHeaderImageUrl = String(headerImageUrlRaw || "").trim();

    // 1) Validate template with Meta (fast fail before accept)
    let templatesRes: any;
    try {
      templatesRes = await getTemplatesService();
    } catch (metaErr: any) {
      console.error("❌ Meta templates fetch failed:", metaErr?.message);
      return res.status(502).json({
        success: false,
        message:
          "Could not load WhatsApp templates from Meta. Check WhatsApp credentials / network.",
        error: metaErr?.message,
      });
    }

    const templates = templatesRes?.data || [];
    const template = templates.find(
      (t: any) =>
        t.name?.toLowerCase().trim() ===
        String(templateName).toLowerCase().trim(),
    );

    if (!template) {
      return res.status(404).json({
        success: false,
        message: `Template "${templateName}" not found on Meta`,
      });
    }

    const status = String(template.status || "").toUpperCase();
    if (status && status !== "APPROVED") {
      return res.status(400).json({
        success: false,
        message: `Template "${template.name}" is ${status}. Only APPROVED templates can be sent.`,
      });
    }

    const headerFormat = resolveHeaderFormat(template);
    if (["IMAGE", "VIDEO", "DOCUMENT"].includes(headerFormat)) {
      const hasSample =
        resolveTemplateHeaderMediaUrl(template).startsWith("http") ||
        requestedHeaderImageUrl.startsWith("http");
      if (!hasSample) {
        return res.status(400).json({
          success: false,
          message: `This template needs a public ${headerFormat} URL. Meta sample is missing — upload/paste a campaign image, then send.`,
        });
      }
    }

    const bodyComponent = template.components?.find(
      (c: any) => String(c.type || "").toUpperCase() === "BODY",
    );
    const variableCount = getVariableCount(bodyComponent?.text || "");

    const MODULE_ROLE: Record<string, string> = {
      users: "user",
      agents: "agent",
      builders: "builder",
      builder_staff: "builder_staff",
    };
    const resolvedRoleName = String(
      roleName || MODULE_ROLE[String(moduleId || "").trim()] || "",
    )
      .trim()
      .toLowerCase();

    const filter: any = {
      phone: { $exists: true, $nin: [null, ""] },
      isActive: { $ne: false },
    };

    const escapeRegex = (value: string) =>
      String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const exactCi = (value: unknown) => {
      const v = String(value || "").trim();
      return v ? new RegExp(`^${escapeRegex(v)}$`, "i") : null;
    };
    const stateRx = exactCi(state);
    const cityRx = exactCi(city);
    const localityRx = exactCi(locality);
    if (stateRx) filter.state = stateRx;
    if (cityRx) filter.city = cityRx;
    if (localityRx) filter.locality = localityRx;

    if (roleId && Types.ObjectId.isValid(roleId)) {
      filter.roleId = new Types.ObjectId(roleId);
    } else if (resolvedRoleName) {
      const roleDoc = await Role.findOne({ name: resolvedRoleName })
        .select("_id")
        .lean();
      if (roleDoc?._id) {
        filter.roleId = roleDoc._id;
      }
    }

    const estimatedRecipients = await User.countDocuments(filter);
    if (estimatedRecipients === 0) {
      return res.status(404).json({
        success: false,
        message: "No recipients found for this location filter.",
        campaignId,
      });
    }

    const phoneKey = String(recipientField || "phone").trim() || "phone";
    const language =
      typeof template.language === "string"
        ? template.language
        : template.language?.code || "en";

    // Serializable filter for Redis (RegExp → pattern string)
    const serializableFilter: Record<string, unknown> = {
      phone: { $exists: true, $nin: [null, ""] },
      isActive: { $ne: false },
    };
    if (String(state || "").trim()) {
      serializableFilter.state = {
        $regex: `^${escapeRegex(String(state).trim())}$`,
        $options: "i",
      };
    }
    if (String(city || "").trim()) {
      serializableFilter.city = {
        $regex: `^${escapeRegex(String(city).trim())}$`,
        $options: "i",
      };
    }
    if (String(locality || "").trim()) {
      serializableFilter.locality = {
        $regex: `^${escapeRegex(String(locality).trim())}$`,
        $options: "i",
      };
    }
    if (filter.roleId) {
      serializableFilter.roleId = String(filter.roleId);
    }

    await WhatsAppCampaignRun.create({
      campaignId,
      source: "crm",
      templateName: template.name || templateName,
      status: "accepted",
      estimatedRecipients,
      filter: serializableFilter,
      headerImageUrl: requestedHeaderImageUrl || undefined,
    });

    try {
      await addWhatsAppJobWithTimeout(
        "fanout-crm-campaign",
        {
          campaignId,
          templateName: template.name || templateName,
          language,
          variableCount,
          phoneKey,
          filter: serializableFilter,
          ...(requestedHeaderImageUrl
            ? { requestedHeaderImageUrl }
            : {}),
        },
        {
          attempts: 2,
          backoff: { type: "exponential", delay: 8000 },
          removeOnComplete: 100,
          removeOnFail: 200,
        },
      );
    } catch (queueErr: any) {
      await WhatsAppCampaignRun.findOneAndUpdate(
        { campaignId },
        {
          status: "failed",
          error:
            queueErr?.message ||
            "Could not queue campaign (is Redis running?)",
        },
      ).catch(() => undefined);
      return res.status(503).json({
        success: false,
        message:
          "Could not accept WhatsApp campaign. Check that Redis is running.",
        error: queueErr?.message,
        campaignId,
      });
    }

    // Industry standard: accept immediately; fan-out + Meta send happen async
    return res.status(202).json({
      success: true,
      accepted: true,
      status: "accepted",
      campaignId,
      estimatedRecipients,
      templateName: template.name || templateName,
      message: `Campaign accepted for ~${estimatedRecipients} recipient(s). Messages are being queued in the background.`,
    });
  } catch (error: any) {
    console.error("❌ WhatsApp Campaign Error:", error);
    return res.status(500).json({
      success: false,
      message: error?.message || "WhatsApp campaign failed",
    });
  }
};

/** Background: prepare header media once, then enqueue all CRM recipients. */
export async function processCrmCampaignFanout(job: {
  campaignId: string;
  templateName: string;
  language: string;
  variableCount: number;
  phoneKey: string;
  filter: Record<string, unknown>;
  requestedHeaderImageUrl?: string;
}) {
  const {
    campaignId,
    templateName,
    language,
    variableCount,
    phoneKey,
    requestedHeaderImageUrl,
  } = job;

  try {
    await WhatsAppCampaignRun.findOneAndUpdate(
      { campaignId },
      { status: "preparing" },
    );

    const template = await resolveTemplateForSend(templateName);
    const headerFormat = resolveHeaderFormat(template);

    let headerMediaId = "";
    let outboundHeaderUrl = "";
    let sourceHeaderUrl = String(requestedHeaderImageUrl || "").trim();

    if (["IMAGE", "VIDEO", "DOCUMENT"].includes(headerFormat)) {
      const prepared = await resolveCampaignHeaderMedia({
        template,
        requestedUrl: sourceHeaderUrl,
      });
      headerMediaId = prepared.headerMediaId || "";
      outboundHeaderUrl =
        prepared.headerImageUrl || prepared.sourceUrl || "";
      sourceHeaderUrl = prepared.sourceUrl || sourceHeaderUrl;
    }

    await WhatsAppCampaignRun.findOneAndUpdate(
      { campaignId },
      {
        status: "queuing",
        ...(headerMediaId ? { headerMediaId } : {}),
        ...(sourceHeaderUrl ? { headerImageUrl: sourceHeaderUrl } : {}),
      },
    );

    const mongoFilter: any = { ...(job.filter || {}) };
    if (
      mongoFilter.roleId &&
      typeof mongoFilter.roleId === "string" &&
      Types.ObjectId.isValid(mongoFilter.roleId)
    ) {
      mongoFilter.roleId = new Types.ObjectId(mongoFilter.roleId);
    }

    const batchSize = 100;
    let page = 0;
    let queued = 0;
    let skipped = 0;

    while (true) {
      const users = await User.find(mongoFilter)
        .select("name phone email city state locality")
        .skip(page * batchSize)
        .limit(batchSize)
        .lean();
      if (!users.length) break;

      const logsToInsert: any[] = [];
      const sendJobs: {
        name: string;
        data: any;
        opts?: any;
      }[] = [];

      for (const user of users) {
        const phoneRaw =
          phoneKey === "phone"
            ? user.phone
            : (user as any)[phoneKey] || user.phone;
        if (!phoneRaw) {
          skipped += 1;
          continue;
        }

        const variables = buildCampaignVariables(
          {
            name: user.name || "User",
            city: user.city || "",
            state: user.state || "",
            locality: (user as any).locality || "",
            email: (user as any).email || "",
          },
          variableCount,
        );

        const logId = new Types.ObjectId();
        logsToInsert.push({
          _id: logId,
          to: String(phoneRaw),
          templateName: template.name || templateName,
          status: "pending",
          campaignId,
          variables,
          language,
          ...(sourceHeaderUrl ? { headerImageUrl: sourceHeaderUrl } : {}),
          ...(headerMediaId ? { headerMediaId } : {}),
        });

        sendJobs.push({
          name: "send-message",
          data: {
            campaignId,
            to: String(phoneRaw),
            templateName: template.name || templateName,
            variables,
            language,
            logId: logId.toString(),
            ...(headerFormat ? { headerFormat } : {}),
            ...(headerMediaId
              ? { headerMediaId }
              : outboundHeaderUrl
                ? { headerImageUrl: outboundHeaderUrl }
                : {}),
          },
          opts: {
            attempts: 3,
            backoff: { type: "exponential", delay: 5000 },
          },
        });
      }

      if (logsToInsert.length) {
        await WhatsAppLog.insertMany(logsToInsert, { ordered: false });
      }
      if (sendJobs.length) {
        await whatsappQueue.addBulk(sendJobs);
        queued += sendJobs.length;
      }

      page += 1;
    }

    await WhatsAppCampaignRun.findOneAndUpdate(
      { campaignId },
      {
        status: queued > 0 ? "queued" : "failed",
        queued,
        skipped,
        ...(queued === 0
          ? {
              error:
                skipped > 0
                  ? "No valid recipients with phone numbers for this audience."
                  : "No recipients found for this location filter.",
            }
          : {}),
      },
    );

    console.log(
      `✅ CRM fan-out ${campaignId}: queued=${queued} skipped=${skipped}`,
    );
    return { queued, skipped };
  } catch (err: any) {
    console.error("❌ CRM fan-out failed:", err?.message || err);
    await WhatsAppCampaignRun.findOneAndUpdate(
      { campaignId },
      {
        status: "failed",
        error: err?.message || "Campaign fan-out failed",
      },
    ).catch(() => undefined);
    throw err;
  }
}

function normalizeValidWhatsAppPhone(raw: string): string {
  const trimmed = String(raw || "").trim();
  if (!trimmed) return "";
  let digits = trimmed.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.length === 10) digits = `91${digits}`;
  if (digits.length === 11 && digits.startsWith("0")) {
    digits = `91${digits.slice(1)}`;
  }
  if (digits.length < 10 || digits.length > 15) return "";
  if (/^0+$/.test(digits) || digits === "1234567890") return "";
  if (digits.startsWith("91") && digits.length === 12) {
    const local = digits.slice(2);
    if (!/^[6-9]\d{9}$/.test(local)) return "";
  }
  return digits;
}

function csvRowIsOptedOut(row: Record<string, string>): boolean {
  for (const [key, value] of Object.entries(row)) {
    const v = String(value ?? "")
      .trim()
      .toLowerCase();
    if (
      /opt.?out|unsubscribe/i.test(key) &&
      [
        "1",
        "true",
        "yes",
        "y",
        "opted out",
        "opt-out",
        "optout",
        "unsubscribe",
        "unsubscribed",
        "stop",
        "stopped",
        "blocked",
      ].includes(v)
    ) {
      return true;
    }
    if (
      /^(status|consent)$/i.test(key.trim()) &&
      /opt.?out|unsub|stop|block/i.test(String(value ?? ""))
    ) {
      return true;
    }
  }
  return false;
}

function pickPhoneFromRow(
  row: Record<string, string>,
  phoneField?: string,
): string {
  if (phoneField) {
    const exact = Object.keys(row).find(
      (k) => k.trim().toLowerCase() === phoneField.trim().toLowerCase(),
    );
    if (exact) return String(row[exact] ?? "").trim();
  }
  const keys = Object.keys(row);
  const phoneKey = keys.find((k) =>
    /^(phone|mobile|whatsapp|wa[_-]?id|msisdn)$/i.test(k.trim()),
  );
  return String(phoneKey ? row[phoneKey] : "").trim();
}

function buildCsvRowVariables(
  row: Record<string, string>,
  expectedCount?: number,
  fieldMapping?: Record<string, string> | null,
): string[] {
  const resolveColumn = (header: string) => {
    const key = Object.keys(row).find(
      (k) =>
        k.trim().toLowerCase() === String(header || "").trim().toLowerCase(),
    );
    return key ? String(row[key] ?? "").trim() : "";
  };

  if (fieldMapping && typeof fieldMapping === "object") {
    const count =
      typeof expectedCount === "number" && expectedCount > 0
        ? expectedCount
        : Math.max(
            0,
            ...Object.keys(fieldMapping)
              .map((k) => parseInt(k, 10))
              .filter((n) => !Number.isNaN(n)),
          );
    if (count <= 0) return [];
    return Array.from({ length: count }, (_, i) => {
      const mappedHeader =
        fieldMapping[String(i + 1)] || (fieldMapping as any)[i + 1];
      const value = mappedHeader ? resolveColumn(mappedHeader) : "";
      return value || "Customer";
    });
  }

  if (typeof expectedCount === "number" && expectedCount >= 0) {
    if (expectedCount === 0) return [];
    const skip = /^(phone|mobile|whatsapp|wa[_-]?id|msisdn|email)$/i;
    const values: string[] = [];
    for (const [k, v] of Object.entries(row)) {
      if (skip.test(k.trim())) continue;
      const text = String(v ?? "").trim();
      if (text) values.push(text);
    }
    return Array.from({ length: expectedCount }, (_, i) => {
      const v = values[i];
      return v != null && String(v).trim() ? String(v).trim() : "Customer";
    });
  }

  return ["Customer"];
}

/** Background: prepare header media once, then enqueue CSV rows. */
export async function processCsvCampaignFanout(job: {
  campaignId: string;
  templateName: string;
  language: string;
  category: string;
  expectedVars: number;
  fieldMapping: Record<string, string>;
  phoneField: string;
  baseDelayMs: number;
  requestedHeaderImageUrl?: string;
  rows: Record<string, string>[];
}) {
  const {
    campaignId,
    templateName,
    language,
    category,
    expectedVars,
    fieldMapping,
    phoneField,
    baseDelayMs,
    requestedHeaderImageUrl,
    rows,
  } = job;

  try {
    await WhatsAppCampaignRun.findOneAndUpdate(
      { campaignId },
      { status: "preparing" },
    );

    const template = await resolveTemplateForSend(templateName);
    const headerFormat = resolveHeaderFormat(template);

    let headerMediaId = "";
    let outboundHeaderUrl = "";
    let sourceHeaderUrl = String(requestedHeaderImageUrl || "").trim();

    if (["IMAGE", "VIDEO", "DOCUMENT"].includes(headerFormat)) {
      const prepared = await resolveCampaignHeaderMedia({
        template,
        requestedUrl: sourceHeaderUrl,
      });
      headerMediaId = prepared.headerMediaId || "";
      outboundHeaderUrl =
        prepared.headerImageUrl || prepared.sourceUrl || "";
      sourceHeaderUrl = prepared.sourceUrl || sourceHeaderUrl;
    }

    await WhatsAppCampaignRun.findOneAndUpdate(
      { campaignId },
      {
        status: "queuing",
        ...(headerMediaId ? { headerMediaId } : {}),
        ...(sourceHeaderUrl ? { headerImageUrl: sourceHeaderUrl } : {}),
      },
    );

    let queued = 0;
    let skipped = 0;
    const seenPhones = new Set<string>();
    const BATCH = 50;
    let batchLogs: any[] = [];
    let batchJobs: { name: string; data: any; opts?: any }[] = [];

    const flush = async () => {
      if (batchLogs.length) {
        await WhatsAppLog.insertMany(batchLogs, { ordered: false });
        batchLogs = [];
      }
      if (batchJobs.length) {
        await whatsappQueue.addBulk(batchJobs);
        queued += batchJobs.length;
        batchJobs = [];
      }
    };

    for (const row of rows) {
      if (csvRowIsOptedOut(row)) {
        skipped += 1;
        continue;
      }
      const phoneRaw = pickPhoneFromRow(row, phoneField || undefined);
      const formattedPhone = normalizeValidWhatsAppPhone(phoneRaw);
      if (!formattedPhone) {
        skipped += 1;
        continue;
      }
      if (seenPhones.has(formattedPhone)) {
        skipped += 1;
        continue;
      }
      seenPhones.add(formattedPhone);
      const variables = buildCsvRowVariables(
        row,
        expectedVars,
        fieldMapping || null,
      );
      const logId = new Types.ObjectId();

      batchLogs.push({
        _id: logId,
        to: formattedPhone,
        templateName: template.name || templateName,
        status: "pending",
        campaignId,
        variables,
        language,
        category,
        ...(sourceHeaderUrl ? { headerImageUrl: sourceHeaderUrl } : {}),
        ...(headerMediaId ? { headerMediaId } : {}),
      });

      batchJobs.push({
        name: "send-message",
        data: {
          to: formattedPhone,
          templateName: template.name || templateName,
          variables,
          language,
          campaignId,
          logId: logId.toString(),
          ...(headerFormat ? { headerFormat } : {}),
          ...(headerMediaId
            ? { headerMediaId }
            : outboundHeaderUrl
              ? { headerImageUrl: outboundHeaderUrl }
              : {}),
        },
        opts: {
          attempts: 3,
          backoff: { type: "exponential", delay: 5000 },
          delay: baseDelayMs + queued * 300 + batchJobs.length * 300,
        },
      });

      if (batchLogs.length >= BATCH) {
        await flush();
      }
    }

    await flush();

    await WhatsAppCampaignRun.findOneAndUpdate(
      { campaignId },
      {
        status: queued > 0 ? "queued" : "failed",
        queued,
        skipped,
        ...(queued === 0
          ? {
              error: phoneField
                ? `No valid numbers in column "${phoneField}".`
                : "No valid phone numbers found in file.",
            }
          : {}),
      },
    );

    console.log(
      `✅ CSV fan-out ${campaignId}: queued=${queued} skipped=${skipped}`,
    );
    return { queued, skipped };
  } catch (err: any) {
    console.error("❌ CSV fan-out failed:", err?.message || err);
    await WhatsAppCampaignRun.findOneAndUpdate(
      { campaignId },
      {
        status: "failed",
        error: err?.message || "CSV campaign fan-out failed",
      },
    ).catch(() => undefined);
    throw err;
  }
}

export const sendWhatsAppBulkMessages = async ({
  to,
  templateName,
  variables,
  language,
  headerImageUrl,
  headerMediaId,
  headerFormat: headerFormatHint,
}: SendWhatsAppInput) => {
  try {
    if (!to || !templateName) {
      throw new Error("Missing required fields");
    }

    const { token, phoneId, apiVersion } = resolveMetaAuth();
    if (!token || !phoneId) {
      throw new Error(
        "WhatsApp credentials missing (WHATSAPP_TOKEN / WHATSAPP_PHONE_NUMBER_ID)",
      );
    }

    const cleanPhone = String(to).replace(/\D/g, "");
    const formattedPhone = cleanPhone.startsWith("91")
      ? cleanPhone
      : `91${cleanPhone}`;

    if (formattedPhone.length < 12) {
      throw new Error(`Invalid phone number: ${to}`);
    }

    if (!Array.isArray(variables)) {
      throw new Error("Variables must be an array");
    }

    /**
     * Fast path (production): when fan-out already prepared media + vars,
     * do NOT re-fetch Meta template list for every recipient (rate-limit / hang).
     */
    const hasPreparedHeader =
      Boolean(String(headerMediaId || "").trim()) ||
      (String(headerImageUrl || "").trim().startsWith("http") &&
        !isMetaHostedMediaUrl(String(headerImageUrl)));

    let templateNameFinal = String(templateName).trim();
    let lang = String(language || "en").trim() || "en";
    let headerFormat = String(headerFormatHint || "").toUpperCase();
    // Fan-out always prepares IMAGE/VIDEO/DOCUMENT media ids for those templates.
    if (!headerFormat && String(headerMediaId || "").trim()) {
      headerFormat = "IMAGE";
    }
    let alignedVars = variables.map((v) =>
      v != null && String(v).trim() ? String(v).trim() : "Customer",
    );

    if (!hasPreparedHeader || !headerFormat) {
      const template = await resolveTemplateForSend(templateName);
      templateNameFinal = template.name || templateNameFinal;
      lang = templateLanguageCode(template, language || "en");
      headerFormat = resolveHeaderFormat(template) || headerFormat;
      const bodyComponent = template.components?.find(
        (c: any) => String(c.type || "").toUpperCase() === "BODY",
      );
      const variableCount = getVariableCount(bodyComponent?.text || "");
      alignedVars = alignVariables(variables, variableCount);
    }

    const components: any[] = [];

    if (["IMAGE", "VIDEO", "DOCUMENT"].includes(headerFormat)) {
      const prepared = await prepareHeaderMediaForSend({
        format: headerFormat,
        url: String(headerImageUrl || "").trim(),
        ...(headerMediaId ? { mediaId: headerMediaId } : {}),
      });
      const mediaKey = headerFormat.toLowerCase();
      const mediaParam = prepared.id
        ? { id: prepared.id }
        : { link: prepared.link };
      components.push({
        type: "header",
        parameters: [
          {
            type: mediaKey,
            [mediaKey]: mediaParam,
          },
        ],
      });
    }

    if (alignedVars.length > 0) {
      components.push({
        type: "body",
        parameters: alignedVars.map((v) => ({
          type: "text",
          text: v,
        })),
      });
    }

    const payload = {
      messaging_product: "whatsapp",
      to: formattedPhone,
      type: "template",
      template: {
        name: templateNameFinal,
        language: { code: lang },
        ...(components.length ? { components } : {}),
      },
    };

    console.log("📤 Sending to:", formattedPhone);

    const response = await axios.post(
      `https://graph.facebook.com/${apiVersion}/${phoneId}/messages`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        timeout: 30000,
      },
    );

    console.log("✅ Sent:", response.data);
    return response.data;
  } catch (err: any) {
    console.error("❌ WhatsApp Error:", err.response?.data || err.message);

    const meta =
      err.response?.data?.error?.error_user_msg ||
      err.response?.data?.error?.message ||
      err.message ||
      "WhatsApp failed";
    throw new Error(meta);
  }
};
