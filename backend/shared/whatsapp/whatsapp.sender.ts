/**
 * Implement WhatsApp text send used by inbox replies.
 */
import axios from "axios";

const API_VERSION = process.env.WHATSAPP_API_VERSION || "v23.0";

export const sendTextMessage = async (to: string, body: string) => {
  const token = process.env.WHATSAPP_TOKEN || "";
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || "";

  if (!token || !phoneNumberId) {
    throw new Error("WhatsApp credentials are missing");
  }

  const url = `https://graph.facebook.com/${API_VERSION}/${phoneNumberId}/messages`;

  return axios.post(
    url,
    {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: String(to).replace(/\D/g, ""),
      type: "text",
      text: { preview_url: false, body },
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
  );
};
