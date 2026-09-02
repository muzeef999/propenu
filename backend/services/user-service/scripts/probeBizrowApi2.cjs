require("dotenv").config();

const BASE = "https://api.bizrow.app";
const token = process.env.WHATSAPP_TOKEN || "";
const verify = process.env.WHATSAPP_VERIFY_TOKEN || "";
const slug = process.env.WHATSAPP_WEBHOOK_SLUG || "tyent";

const auths = [
  ["wa-bearer", { Authorization: `Bearer ${token}` }],
  ["verify-bearer", { Authorization: `Bearer ${verify}` }],
  ["token-q", null],
  ["x-access-token", { "x-access-token": token }],
  ["x-auth-token", { "x-auth-token": token }],
  ["api-key", { "api-key": token }],
  ["x-api-key-wa", { "x-api-key": token }],
  ["x-api-key-verify", { "x-api-key": verify }],
];

const paths = [
  "/api/whatsapp/conversations",
  "/api/whatsapp/inbox",
  "/api/whatsapp/inbox/conversations",
  `/api/whatsapp/${slug}/conversations`,
  "/api/users/whatsapp/inbox/conversations",
  "/api/conversation-flow/tyent/conversations",
  "/api/conversation-flow/conversations?tenant=tyent",
  "/health",
  "/",
];

(async () => {
  for (const path of paths) {
    for (const [name, headers] of auths) {
      let url = `${BASE}${path}`;
      const h = { Accept: "application/json", ...(headers || {}) };
      if (name === "token-q") url += (path.includes("?") ? "&" : "?") + `token=${encodeURIComponent(token)}`;
      try {
        const res = await fetch(url, {
          headers: h,
          signal: AbortSignal.timeout(8000),
        });
        const text = await res.text();
        if (res.status === 404) continue;
        console.log(res.status, path, name, text.slice(0, 220).replace(/\s+/g, " "));
      } catch {}
    }
  }

  // Meta Graph: try conversations
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const ver = process.env.WHATSAPP_API_VERSION || "v23.0";
  const graphPaths = [
    `/${phoneId}?fields=display_phone_number,verified_name`,
    `/${phoneId}/conversations`,
    `/${phoneId}/message_templates?limit=1`,
    `/${process.env.WHATSAPP_BUSINESS_ACCOUNT_ID}/conversations`,
  ];
  console.log("\n--- Graph ---");
  for (const p of graphPaths) {
    try {
      const res = await fetch(`https://graph.facebook.com/${ver}${p}`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(10000),
      });
      const text = await res.text();
      console.log(res.status, p, text.slice(0, 300).replace(/\s+/g, " "));
    } catch (e) {
      console.log("err", p, e.message);
    }
  }
})();
