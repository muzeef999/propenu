import axios from "axios";
import { Request, Response } from "express";
import { Types } from "mongoose";

import { whatsappQueue } from "../../../services/user-service/src/queues";
import User from "../../../services/user-service/src/models/userModel";

const BASE_URL = "https://graph.facebook.com/v19.0";

const TOKEN =
  "EAAXhIccvVfgBQvEc8BR5zh8DSyeEfvY9ZCoQHrIG7a8zRBHkN2kfKuUHujlpo31J1oZBfwCNM9DlXpXhQuoubdcAhLmhahYj2LdgQ8iTYytWMK6HMghwHZCxaNSLEhZBrvD3r9ZA6ZCRnJmStnLhoflMLt2szXvyW3fmC507UKfLFX3RCvSbFpAjYut2Avw1rQUgZDZD";
const BUSINESS_ID = "1519313212465013";
const PHONE_ID = "935750846293139";

interface SendWhatsAppInput {
  to: string;
  templateName: string;
  variables: string[];
}

// CREATE TEMPLATE
export const createTemplateService = async (data: any) => {
  const res = await axios.post(
    `${BASE_URL}/${BUSINESS_ID}/message_templates`,
    data,
    {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
      },
    },
  );

  return res.data;
};

// GET ALL TEMPLATES
export const getTemplatesService = async () => {
  const res = await axios.get(`${BASE_URL}/${BUSINESS_ID}/message_templates`, {
    headers: {
      Authorization: `Bearer ${TOKEN}`,
    },
  });
  return res.data;
};

// DELETE TEMPLATE
export const deleteTemplateService = async (name: string) => {
  const res = await axios.delete(
    `${BASE_URL}/${BUSINESS_ID}/message_templates?name=${encodeURIComponent(name)}`,
    {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
      },
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
    const { templateName, city, state, roleId } = req.body;

    if (!templateName) {
      return res.status(400).json({
        success: false,
        message: "templateName is required",
      });
    }

    // ✅ 1. Fetch template dynamically
    const templatesRes = await getTemplatesService();

    const templates =
      templatesRes?.data?.data?.data || templatesRes?.data?.data || [];

    const template = templates.find(
      (t: any) =>
        t.name?.toLowerCase().trim() === templateName.toLowerCase().trim(),
    );

    if (!template) {
      return res.status(400).json({
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

    if (variableCount === 0) {
      return res.status(400).json({
        success: false,
        message: "No variables in template",
      });
    }

    // ✅ 3. Build filter
    const filter: any = {
      isActive: true,
      phone: { $exists: true, $ne: null },
    };

    if (city) filter.city = city;
    if (state) filter.state = state;

    if (roleId && Types.ObjectId.isValid(roleId)) {
      filter.roleId = new Types.ObjectId(roleId);
    }

    const batchSize = 100;
    let page = 0;
    let totalUsers = 0;

    while (true) {
      const users = await User.find(filter).lean();

      if (!users.length) break;

      for (const user of users) {
        if (!user.phone) continue;

        // ✅ 4. Extract dynamic values from DB
        const userKeys = Object.keys(user).filter(
          (k) => k !== "phone" && k !== "_id" && k !== "__v",
        );

        // 🔥 pick only required number of variables
        const variables = userKeys
          .slice(0, variableCount)
          .map((key) => String((user as any)[key] || ""));

        if (variables.length !== variableCount) continue;

        await whatsappQueue.add("send-message", {
          campaignId,
          to: user.phone,
          templateName,
          variables,
        });

        await new Promise((r) => setTimeout(r, 300));
      }

      totalUsers += users.length;
      page++;
      break; // remove if using pagination properly
    }

    return res.json({
      success: true,
      campaignId,
      totalUsers,
      message: "WhatsApp dynamic campaign queued",
    });
  } catch (error: any) {
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
}: SendWhatsAppInput) => {
  try {
    if (!to || !templateName) {
      throw new Error("Missing required fields");
    }

    // ✅ format phone
    const cleanPhone = String(to).replace(/\D/g, "");
    const formattedPhone = cleanPhone.startsWith("91")
      ? cleanPhone
      : `91${cleanPhone}`;

    // ✅ payload
    const payload = {
      messaging_product: "whatsapp",
      to: formattedPhone,
      type: "template",
      template: {
        name: templateName,
        language: { code: "en" },
        components: [
          {
            type: "body",
            parameters: variables.map((v) => ({
              type: "text",
              text: String(v),
            })),
          },
        ],
      },
    };

    console.log("📤 Sending:", payload);

    const response = await axios.post(
      `https://graph.facebook.com/v18.0/${PHONE_ID}/messages`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (err: any) {
    console.error("❌ WhatsApp Error:", err.response?.data || err.message);
    throw new Error(err.response?.data?.error?.message || "WhatsApp failed");
  }
};