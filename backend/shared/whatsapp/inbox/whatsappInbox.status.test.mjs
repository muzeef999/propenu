const STATUS_RANK = {
  pending: 0,
  sent: 1,
  delivered: 2,
  read: 3,
  failed: 4,
};

function shouldApplyStatus(current, next) {
  const cur = String(current || "pending").toLowerCase();
  const nxt = String(next || "").toLowerCase();
  if (!nxt) return false;
  if (cur === "failed") return nxt === "failed";
  if (nxt === "failed") return true;
  return (STATUS_RANK[nxt] ?? -1) >= (STATUS_RANK[cur] ?? -1);
}

function extractMetaMessageId(response) {
  const r = response || {};
  const id =
    r?.messages?.[0]?.id ||
    r?.data?.messages?.[0]?.id ||
    r?.response?.messages?.[0]?.id ||
    "";
  return String(id || "").trim();
}

const cases = [
  [shouldApplyStatus("sent", "delivered"), true, "sent→delivered"],
  [shouldApplyStatus("delivered", "read"), true, "delivered→read"],
  [shouldApplyStatus("read", "delivered"), false, "read↛delivered"],
  [shouldApplyStatus("read", "sent"), false, "read↛sent"],
  [shouldApplyStatus("pending", "sent"), true, "pending→sent"],
  [shouldApplyStatus("sent", "failed"), true, "sent→failed"],
  [shouldApplyStatus("failed", "delivered"), false, "failed↛delivered"],
  [
    extractMetaMessageId({ messages: [{ id: "wamid.ABC" }] }) === "wamid.ABC",
    true,
    "extract meta id",
  ],
  [
    extractMetaMessageId({ data: { messages: [{ id: "wamid.XYZ" }] } }) ===
      "wamid.XYZ",
    true,
    "extract nested meta id",
  ],
];

let failed = 0;
for (const [ok, expected, name] of cases) {
  if (ok !== expected) {
    console.error("FAIL", name, "got", ok, "expected", expected);
    failed += 1;
  } else {
    console.log("OK", name);
  }
}

if (failed) {
  process.exit(1);
}
console.log(`All ${cases.length} inbox status checks passed`);
