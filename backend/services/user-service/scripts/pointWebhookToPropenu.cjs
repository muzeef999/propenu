/**
 * Point Meta WhatsApp inbound webhooks at a public Propenu HTTPS URL.
 *
 * Usage:
 *   node scripts/pointWebhookToPropenu.cjs https://your-public-host
 *
 * Example (with ngrok/cloudflared tunnel to gateway :4000):
 *   node scripts/pointWebhookToPropenu.cjs https://abc123.ngrok-free.app
 */
require("dotenv").config();
const axios = require("axios");

const base = String(process.argv[2] || process.env.WHATSAPP_PUBLIC_BASE_URL || "")
  .trim()
  .replace(/\/+$/, "");
const slug = process.env.WHATSAPP_WEBHOOK_SLUG || "tyent";
const token = process.env.WHATSAPP_TOKEN || "";
const waba = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || "";
const verify = process.env.WHATSAPP_VERIFY_TOKEN || "";
const ver = process.env.WHATSAPP_API_VERSION || "v23.0";
const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID || "";

if (!base || !/^https:\/\//i.test(base)) {
  console.error(
    "Pass a public HTTPS base URL.\nExample: node scripts/pointWebhookToPropenu.cjs https://xxxx.ngrok-free.app",
  );
  process.exit(1);
}

const callbackUrl = `${base}/api/conversation-flow/webhook/${slug}`;

(async () => {
  console.log("Current Meta webhook:");
  const phone = await axios.get(
    `https://graph.facebook.com/${ver}/${phoneId}?fields=webhook_configuration`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  console.log(phone.data?.webhook_configuration || phone.data);

  console.log("\n1) Subscribe app to WABA…");
  await axios.post(
    `https://graph.facebook.com/${ver}/${waba}/subscribed_apps`,
    {},
    { headers: { Authorization: `Bearer ${token}` } },
  );

  console.log("2) Override callback →", callbackUrl);
  const override = await axios.post(
    `https://graph.facebook.com/${ver}/${waba}/subscribed_apps`,
    {
      override_callback_uri: callbackUrl,
      verify_token: verify,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
  );
  console.log("override result:", override.data);

  const after = await axios.get(
    `https://graph.facebook.com/${ver}/${phoneId}?fields=webhook_configuration`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  console.log("\nNew Meta webhook:", after.data?.webhook_configuration || after.data);
  console.log(
    "\nDone. Keep your tunnel/gateway running, then ask the customer to send a WhatsApp message.",
  );
})().catch((err) => {
  console.error(
    err?.response?.data || err?.message || err,
  );
  process.exit(1);
});
