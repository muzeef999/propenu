import axios from "axios";

/** Meta Cloud API expects international number digits only (no + / spaces). */
function toWhatsAppRecipient(phone: string) {
  return String(phone || "").replace(/\D/g, "");
}

export async function sendOtpWhatsApp(phone: string, otp: string) {
  try {
    const to = toWhatsAppRecipient(phone);
    if (!to || to.length < 10) {
      throw new Error("Invalid WhatsApp recipient phone");
    }

    const url = `https://graph.facebook.com/v20.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
    
    const payload = {
      messaging_product: "whatsapp",
      to,
      type: "template",
      template: {
        name: "auth_otp",
        language: { code: "en" },
        components: [
          {
            type: "body",
            parameters: [
              {
                type: "text",
                text: otp,
              },
            ],
          },
          {
            type: "button",
            sub_type: "url",
            index: "0",
            parameters: [
              {
                type: "text",
                text: otp,
              },
            ],
          },
        ],
      },
    };

    const res = await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    console.log("✅ WhatsApp OTP sent:", res.data);
    return res.data;

  } catch (err: any) {
    console.error("❌ WhatsApp FULL error:");
    console.error(JSON.stringify(err?.response?.data || err?.message, null, 2));
    throw new Error(
      err?.response?.data?.error?.message ||
        err?.message ||
        "WhatsApp OTP failed",
    );
  }
}
