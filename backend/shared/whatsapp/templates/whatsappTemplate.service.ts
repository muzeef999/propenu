import axios from "axios";
import { Request, Response } from "express";
import { Types } from "mongoose";

import { whatsappQueue } from "../../../services/user-service/src/queues";
import User from "../../../services/user-service/src/models/userModel";
import Role from "../../../services/user-service/src/models/roleModel";
import { WhatsAppLog } from "../../../services/user-service/src/logs/whatsappLog.model";

const TOKEN =
  "EAAXhIccvVfgBQvEc8BR5zh8DSyeEfvY9ZCoQHrIG7a8zRBHkN2kfKuUHujlpo31J1oZBfwCNM9DlXpXhQuoubdcAhLmhahYj2LdgQ8iTYytWMK6HMghwHZCxaNSLEhZBrvD3r9ZA6ZCRnJmStnLhoflMLt2szXvyW3fmC507UKfLFX3RCvSbFpAjYut2Avw1rQUgZDZD";
const BUSINESS_ID = "1519313212465013";
const PHONE_ID = "935750846293139";



interface SendWhatsAppInput {
  to: string;
  templateName: string;
  variables: string[];
  language?: string;
  headerImageUrl?: string;
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
    },
  );

  return res.data;
};

const getVariableCount = (text: string): number => {
  const matches = text.match(/{{\d+}}/g);
  return matches ? matches.length : 0;
};

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
    } = req.body;

    if (!templateName) {
      return res.status(400).json({
        success: false,
        message: "templateName is required",
      });
    }

    // ✅ 1. Fetch templates
    const templatesRes = await getTemplatesService();
    const templates = templatesRes?.data || [];

    const template = templates.find(
      (t: any) =>
        t.name?.toLowerCase().trim() === templateName.toLowerCase().trim(),
    );

    if (!template) {
      return res.status(404).json({
        success: false,
        message: "Template not found",
      });
    }

    // ✅ 2. Get variable count
    const bodyComponent = template.components?.find(
      (c: any) => c.type === "BODY",
    );

    const templateText = bodyComponent?.text || "";
    const variableCount = getVariableCount(templateText);

    // Map user-collection modules → role names
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

    // ✅ 3. Build filter
    const filter: any = {
      isActive: true,
      phone: { $exists: true, $ne: null },
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

    const phoneKey = String(recipientField || "phone").trim() || "phone";

    // ✅ 4. Pagination (same as email)
    const batchSize = 100;
    let page = 0;
    let totalUsers = 0;

    while (true) {
      const users = await User.find(filter)
        .select("name phone email city state locality")
        .skip(page * batchSize)
        .limit(batchSize)
        .lean();
      if (!users.length) break;

      for (const user of users) {
        const phoneRaw =
          phoneKey === "phone"
            ? user.phone
            : (user as any)[phoneKey] || user.phone;
        if (!phoneRaw) continue;

        // ✅ 5. Prepare variables (SAFE mapping — profile order)
        const data = {
          name: user.name || "User",
          city: user.city || "",
          state: user.state || "",
          locality: (user as any).locality || "",
          email: (user as any).email || "",
        };

        const variables = Object.values(data).slice(0, variableCount);

        if (variables.length !== variableCount) continue;

        const log = await WhatsAppLog.create({
          to: phoneRaw,
          templateName,
          status: "pending",
          campaignId,
          variables,
        });

        console.log("🧾 Log created:", log._id);

        // ✅ 6. Add to queue
        await whatsappQueue.add(
          "send-message",
          {
            campaignId,
            to: phoneRaw,
            templateName,
            variables,
            language:
              typeof template.language === "string"
                ? template.language
                : template.language?.code || "en",
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
        // ✅ 7. Delay (avoid block)
        await new Promise((r) => setTimeout(r, 300));
      }
      totalUsers += users.length;
      page++;
    }
    return res.json({
      success: true,
      campaignId,
      totalUsers,
      message: "WhatsApp campaign queued successfully",
    });
  } catch (error: any) {
    console.error("❌ WhatsApp Campaign Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const sendWhatsAppBulkMessages = async ({
  to,
  templateName,
  variables,
  language,
  headerImageUrl,
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

    const template = await resolveTemplateForSend(templateName);
    const lang = templateLanguageCode(template, language || "en");

    const bodyComponent = template.components?.find(
      (c: any) => String(c.type || "").toUpperCase() === "BODY",
    );
    const headerComponent = template.components?.find(
      (c: any) => String(c.type || "").toUpperCase() === "HEADER",
    );

    const variableCount = getVariableCount(bodyComponent?.text || "");
    const alignedVars = alignVariables(variables, variableCount);

    const components: any[] = [];
    const headerFormat = String(headerComponent?.format || "").toUpperCase();

    if (["IMAGE", "VIDEO", "DOCUMENT"].includes(headerFormat)) {
      const link = String(headerImageUrl || "").trim();
      if (!link.startsWith("http")) {
        throw new Error(
          `Template "${template.name}" needs a public ${headerFormat} header URL (S3/CDN). Local uploads cannot be sent to Meta.`,
        );
      }
      const mediaKey = headerFormat.toLowerCase();
      components.push({
        type: "header",
        parameters: [
          {
            type: mediaKey,
            [mediaKey]: { link },
          },
        ],
      });
    }

    if (variableCount > 0) {
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
        name: template.name,
        language: { code: lang },
        ...(components.length ? { components } : {}),
      },
    };

    console.log("📤 Sending to:", formattedPhone);
    console.log("📦 Payload:", JSON.stringify(payload, null, 2));

    const response = await axios.post(
      `https://graph.facebook.com/${apiVersion}/${phoneId}/messages`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
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
