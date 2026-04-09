import axios from "axios";

const BASE_URL = "https://graph.facebook.com/v19.0";

const TOKEN = "EAAXhIccvVfgBQvEc8BR5zh8DSyeEfvY9ZCoQHrIG7a8zRBHkN2kfKuUHujlpo31J1oZBfwCNM9DlXpXhQuoubdcAhLmhahYj2LdgQ8iTYytWMK6HMghwHZCxaNSLEhZBrvD3r9ZA6ZCRnJmStnLhoflMLt2szXvyW3fmC507UKfLFX3RCvSbFpAjYut2Avw1rQUgZDZD";
const BUSINESS_ID = "1519313212465013";
const PHONE_ID = "935750846293139"

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
    }
  );

  return res.data;
};

// GET ALL TEMPLATES
export const getTemplatesService = async () => {
  const res = await axios.get(
    `${BASE_URL}/${BUSINESS_ID}/message_templates`,
    {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
      },
    }
  );
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
    }
  );

  return res.data;
};



// ✅ Type
interface SendWhatsAppInput {
  to: string;
  templateName: string;
  variables: string[];
}

// ✅ Service
export const sendWhatsAppMessage = async ({
  to,
  templateName,
  variables,
}: SendWhatsAppInput) => {
  try {
    // ✅ Validate input
    if (!to || !templateName) {
      throw new Error("Missing required fields: to or templateName");
    }

    // ✅ Normalize phone (remove junk + add country code)
    const cleanPhone = String(to).replace(/\D/g, "");
    const formattedPhone = cleanPhone.startsWith("91")
      ? cleanPhone
      : `91${cleanPhone}`;

    // ✅ Build payload
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

    console.log("📤 WhatsApp Payload:", JSON.stringify(payload, null, 2));

    // ✅ API call
    const response = await axios.post(
      `https://graph.facebook.com/v18.0/${PHONE_ID}/messages`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${TOKEN}`, // 🔥 TOKEN USED HERE
          "Content-Type": "application/json",
        },
      }
    );

    console.log("📬 Meta Response:", response.data);

    return response.data;
  } catch (err: any) {
    console.error(
      "❌ WhatsApp Send Error:",
      JSON.stringify(err.response?.data || err.message, null, 2)
    );

    throw new Error(
      err.response?.data?.error?.message || "WhatsApp API failed"
    );
  }
};