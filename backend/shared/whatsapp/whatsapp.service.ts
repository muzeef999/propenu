import axios from "axios";
import {
  WHATSAPP_TEMPLATE_CONFIG,
  WhatsAppCategory,
  WhatsAppEvent,
} from "./whatsapp.templates";

const PHONE_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const TOKEN = process.env.WHATSAPP_TOKEN;


if (!PHONE_ID || !TOKEN) {
  console.error("❌ WhatsApp ENV variables missing");
}

export type ReadyToSendWhatsAppMessage = {
  template: string;
  phone: string;
  parameters: string[];
  category: WhatsAppCategory;
  status: "ready_to_send";
};

export type WhatsAppError = {
  status: "error";
  reason: string;
};

export type WhatsAppMessageResult =
  | ReadyToSendWhatsAppMessage
  | WhatsAppError;

function normalizePhone(phone: string) {
  return phone.replace(/\D/g, "");
}

function validateParameters(parameters: string[]) {
  return parameters.every(
    (parameter) =>
      typeof parameter === "string" && parameter.trim().length > 0,
  );
}

export function prepareTemplateMessage(
  event: WhatsAppEvent,
  phone: string,
  parameters: string[],
): WhatsAppMessageResult {
  const config = WHATSAPP_TEMPLATE_CONFIG[event];

  if (!config) {
    return {
      status: "error",
      reason: `Unsupported WhatsApp event: ${event}`,
    };
  }

  const normalizedPhone = normalizePhone(phone);

  if (!normalizedPhone || normalizedPhone.length < 10) {
    return {
      status: "error",
      reason: "Invalid recipient phone number",
    };
  }

  if (!Array.isArray(parameters)) {
    return {
      status: "error",
      reason: "Parameters must be provided as an array",
    };
  }

  if (!validateParameters(parameters)) {
    return {
      status: "error",
      reason: "Parameters must be non-empty strings",
    };
  }

  if (config.variableCount === null) {
    return {
      status: "error",
      reason: `Template variable count is not configured for ${config.template}`,
    };
  }

  if (parameters.length !== config.variableCount) {
    return {
      status: "error",
      reason: `Parameter mismatch for ${config.template}: expected ${config.variableCount}, received ${parameters.length}`,
    };
  }

  return {
    template: config.template,
    phone: normalizedPhone,
    parameters,
    category: config.category,
    status: "ready_to_send",
  };
}

export async function sendTemplateMessage(
  phone: string,
  template: string,
  params: string[]
) {
  const payload = {
    messaging_product: "whatsapp",
    to: phone, 
    type: "template",
    template: {
      name: template,
      language: { code: "en" },
      components: [
        {
          type: "body",
          parameters: params.map((p) => ({
            type: "text",
            text: p,
          })),
        },
      ],
    },
  };

  const url = `https://graph.facebook.com/v23.0/${PHONE_ID}/messages`;

  return axios.post(url, payload, {
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
    },
  });
}

export async function sendWhatsAppEventMessage(
  event: WhatsAppEvent,
  phone: string,
  parameters: string[],
): Promise<WhatsAppMessageResult> {
  const preparedMessage = prepareTemplateMessage(event, phone, parameters);

  if (preparedMessage.status === "error") {
    return preparedMessage;
  }

  if (!PHONE_ID || !TOKEN) {
    return {
      status: "error",
      reason: "WhatsApp credentials are missing",
    };
  }

  try {
    const response = await sendTemplateMessage(
      preparedMessage.phone,
      preparedMessage.template,
      preparedMessage.parameters,
    );

    console.log("✅ WhatsApp template sent:", {
      event,
      template: preparedMessage.template,
      phone: preparedMessage.phone,
      messageId: response.data?.messages?.[0]?.id,
    });
  } catch (error: any) {
    const metaReason =
      error?.response?.data?.error?.message ||
      error?.response?.data?.error?.error_user_msg ||
      error?.message ||
      "WhatsApp template send failed";

    console.error("❌ WhatsApp template error:", {
      event,
      template: preparedMessage.template,
      phone: preparedMessage.phone,
      details: error?.response?.data || error,
    });

    return {
      status: "error",
      reason: metaReason,
    };
  }

  return preparedMessage;
}
