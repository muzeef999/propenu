import axios from "axios";

const PHONE_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const TOKEN = process.env.WHATSAPP_TOKEN;


if (!PHONE_ID || !TOKEN) {
  console.error("❌ WhatsApp ENV variables missing");
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