import dotenv from "dotenv";
import path from "path";
import mongoose from "mongoose";

dotenv.config({ path: path.resolve(process.cwd(), ".env"), quiet: true });

await mongoose.connect(process.env.MONGO_URI, {
  dbName: process.env.MONGO_DB_NAME,
});

const db = mongoose.connection.db;
const logs = await db
  .collection("whatsapplogs")
  .find({})
  .sort({ createdAt: 1 })
  .toArray();

function normalizeWaId(phone) {
  let d = String(phone || "").replace(/\D/g, "");
  if (d.length === 10) d = `91${d}`;
  if (d.length === 11 && d.startsWith("0")) d = `91${d.slice(1)}`;
  return d;
}

let messagesCreated = 0;
let conversationsTouched = 0;

for (const log of logs) {
  const waId = normalizeWaId(log.to);
  if (!waId) continue;

  const sourceId = `log:${String(log._id)}`;
  const already = await db.collection("whatsappmessages").findOne({ wamid: sourceId });
  if (already) continue;

  const status =
    log.status === "success"
      ? "sent"
      : log.status === "failed"
        ? "failed"
        : "pending";
  const body = `Template: ${log.templateName || "message"}`;
  const at = log.createdAt ? new Date(log.createdAt) : new Date();

  let conv = await db.collection("whatsappconversations").findOne({ waId });
  if (!conv) {
    const inserted = await db.collection("whatsappconversations").insertOne({
      waId,
      profileName: "",
      lastMessageAt: at,
      lastMessagePreview: body.slice(0, 80),
      lastDirection: "outbound",
      unreadCount: 0,
      createdAt: at,
      updatedAt: at,
      __v: 0,
    });
    conv = { _id: inserted.insertedId, waId };
    conversationsTouched += 1;
  } else if (!conv.lastMessageAt || new Date(conv.lastMessageAt) <= at) {
    await db.collection("whatsappconversations").updateOne(
      { _id: conv._id },
      {
        $set: {
          lastMessageAt: at,
          lastMessagePreview: body.slice(0, 80),
          lastDirection: "outbound",
          updatedAt: at,
        },
      },
    );
    conversationsTouched += 1;
  }

  await db.collection("whatsappmessages").insertOne({
    conversationId: conv._id,
    waId,
    direction: "outbound",
    type: "template",
    body,
    wamid: sourceId,
    status,
    raw: { fromLog: true, logId: String(log._id) },
    createdAt: at,
    updatedAt: at,
    __v: 0,
  });
  messagesCreated += 1;
}

const convCount = await db.collection("whatsappconversations").countDocuments();
const msgCount = await db.collection("whatsappmessages").countDocuments();
console.log(
  JSON.stringify(
    {
      logs: logs.length,
      conversationsTouched,
      messagesCreated,
      convCount,
      msgCount,
    },
    null,
    2,
  ),
);

await mongoose.disconnect();
