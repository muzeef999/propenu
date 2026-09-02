/**
 * Ensure an inbox re-engagement template exists (longer body so Meta accepts {{1}}).
 * Also force .env to a working approved 1-var template immediately (test_welcome).
 */
require("dotenv").config();
const axios = require("axios");
const fs = require("fs");
const path = require("path");

const NAME = "inbox_agent_reply";
const LANG = "en";
const FALLBACK = "test_welcome";

(async () => {
  const token = process.env.WHATSAPP_TOKEN;
  const waba = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;
  const ver = process.env.WHATSAPP_API_VERSION || "v23.0";
  if (!token || !waba) throw new Error("Missing WhatsApp env");

  const listUrl = `https://graph.facebook.com/${ver}/${waba}/message_templates?limit=100&fields=name,status,language`;
  const listed = await axios.get(listUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const existing = (listed.data?.data || []).find((t) => t.name === NAME);

  if (!existing) {
    try {
      const createUrl = `https://graph.facebook.com/${ver}/${waba}/message_templates`;
      const payload = {
        name: NAME,
        language: LANG,
        category: "UTILITY",
        components: [
          {
            type: "BODY",
            text:
              "Hello from Propenu support team.\n\n{{1}}\n\nPlease reply to this message if you need any further help. Thank you for contacting Propenu.",
            example: {
              body_text: [
                [
                  "Hi, we received your request and our team will assist you shortly.",
                ],
              ],
            },
          },
        ],
      };
      const created = await axios.post(createUrl, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      console.log("CREATED", created.data);
    } catch (err) {
      console.error("CREATE_FAILED", err?.response?.data || err.message);
    }
  } else {
    console.log("EXISTS", { name: existing.name, status: existing.status });
  }

  // Re-check status of inbox_agent_reply
  const listed2 = await axios.get(listUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const createdOrExisting = (listed2.data?.data || []).find(
    (t) => t.name === NAME,
  );
  const primary =
    createdOrExisting &&
    String(createdOrExisting.status).toUpperCase() === "APPROVED"
      ? NAME
      : FALLBACK;

  const envPath = path.join(__dirname, "..", ".env");
  let envText = fs.readFileSync(envPath, "utf8");
  const upsert = (key, value) => {
    const re = new RegExp(`^${key}=.*$`, "m");
    if (re.test(envText)) envText = envText.replace(re, `${key}=${value}`);
    else envText = `${envText.trimEnd()}\n${key}=${value}\n`;
  };
  upsert("WHATSAPP_INBOX_REPLY_TEMPLATE", primary);
  upsert("WHATSAPP_INBOX_REPLY_TEMPLATE_FALLBACK", FALLBACK);
  upsert("WHATSAPP_TEMPLATE_LANGUAGE", LANG);
  fs.writeFileSync(envPath, envText);
  console.log("ENV", {
    primary,
    fallback: FALLBACK,
    inbox_agent_reply_status: createdOrExisting?.status || "missing",
  });
})().catch((e) => {
  console.error(e?.response?.data || e);
  process.exit(1);
});
