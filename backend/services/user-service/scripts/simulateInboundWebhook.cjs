/**
 * Simulate a Meta inbound webhook → local user-service
 * (tests live inbox + optional auto-reply).
 *
 * Usage:
 *   node scripts/simulateInboundWebhook.cjs 9198XXXXXXXX "Hi"
 */
require("dotenv").config();

const phone = String(process.argv[2] || "").replace(/\D/g, "");
const text = String(process.argv[3] || "Hi").trim();
const base =
  process.env.USER_SERVICE_URL ||
  process.env.WEBHOOK_TEST_BASE ||
  "http://127.0.0.1:4004";

if (!phone) {
  console.error("Usage: node scripts/simulateInboundWebhook.cjs <waId> [text]");
  process.exit(1);
}

const payload = {
  object: "whatsapp_business_account",
  entry: [
    {
      id: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || "WABA",
      changes: [
        {
          field: "messages",
          value: {
            messaging_product: "whatsapp",
            metadata: {
              display_phone_number:
                process.env.WHATSAPP_DISPLAY_PHONE || "9182334233",
              phone_number_id: process.env.WHATSAPP_PHONE_NUMBER_ID,
            },
            contacts: [
              {
                profile: { name: "Test User" },
                wa_id: phone,
              },
            ],
            messages: [
              {
                from: phone,
                id: `wamid.SIM_${Date.now()}`,
                timestamp: String(Math.floor(Date.now() / 1000)),
                type: "text",
                text: { body: text },
              },
            ],
          },
        },
      ],
    },
  ],
};

(async () => {
  const urls = [
    `${base}/api/conversation-flow/webhook/${process.env.WHATSAPP_WEBHOOK_SLUG || "tyent"}`,
    `${base}/api/users/whatsapp/flow/webhook`,
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      console.log(res.status, url);
      if (res.ok) break;
    } catch (e) {
      console.log("fail", url, e.message);
    }
  }
})();
