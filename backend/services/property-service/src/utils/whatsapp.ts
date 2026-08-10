import axios from "axios";

export async function sendOtpWhatsApp(phone: string, otp: string) {
  try {
    const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const token = process.env.WHATSAPP_TOKEN;

    if (!phoneId || !token) {
      console.log(`[WhatsApp OTP] Env missing. OTP for ${phone}: ${otp}`);
      return null;
    }

    const cleanPhone = phone.replace(/\D/g, "");
    const url = `https://graph.facebook.com/v20.0/${phoneId}/messages`;

    const payload = {
      messaging_product: "whatsapp",
      to: cleanPhone,
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
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    console.log(`✅ WhatsApp OTP sent to ${cleanPhone}:`, res.data);
    return res.data;
  } catch (err: any) {
    console.error(
      `❌ WhatsApp OTP failed for ${phone}:`,
      err?.response?.data || err?.message,
    );
    return null;
  }
}
