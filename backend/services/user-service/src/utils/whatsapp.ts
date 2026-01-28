import axios from "axios";

export async function sendOtpWhatsApp(phone: string, otp: string) {
  try {
    const url = `https://graph.facebook.com/v20.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
    
    const payload = {
      messaging_product: "whatsapp",
      to: phone,
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
    console.error(JSON.stringify(err?.response?.data, null, 2));
    throw new Error("WhatsApp OTP failed");
  }
}
