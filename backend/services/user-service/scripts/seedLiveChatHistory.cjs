/**
 * Seed live-style chat history (like Bizrow conversation UI)
 * into Propenu WhatsApp inbox collections.
 *
 * Usage: node scripts/seedLiveChatHistory.cjs
 */
require("dotenv").config();
const mongoose = require("mongoose");

const chats = [
  {
    waId: "917680914066",
    inboxStatus: "new",
    unreadCount: 1,
    messages: [
      {
        direction: "inbound",
        body: "Hi",
        at: "2026-09-01T13:23:00.000Z",
      },
      {
        direction: "outbound",
        body: "Hi , welcome to propenu what do you want to do ? Options: User, Builder, view propties",
        at: "2026-09-01T13:23:00.000Z",
        status: "sent",
      },
    ],
  },
  {
    waId: "919959456647",
    inboxStatus: "resolved",
    unreadCount: 0,
    messages: [
      {
        direction: "inbound",
        body: "option_1788068946146",
        at: "2026-09-01T13:14:00.000Z",
      },
    ],
  },
  {
    waId: "919008211355",
    inboxStatus: "new",
    unreadCount: 0,
    messages: [
      {
        direction: "outbound",
        body: "Maybe I didn't understand you properly....",
        at: "2026-09-01T09:58:00.000Z",
        status: "sent",
      },
    ],
  },
  {
    waId: "917973995252",
    inboxStatus: "new",
    unreadCount: 0,
    messages: [
      {
        direction: "outbound",
        body: "Maybe I didn't understand you properly....",
        at: "2026-09-01T09:40:00.000Z",
        status: "sent",
      },
    ],
  },
];

(async () => {
  await mongoose.connect(process.env.MONGO_URI, {
    dbName: process.env.MONGO_DB_NAME || "propenu",
  });
  const db = mongoose.connection.db;
  const convCol = db.collection("whatsappconversations");
  const msgCol = db.collection("whatsappmessages");

  for (const chat of chats) {
    const last = chat.messages[chat.messages.length - 1];
    const lastAt = new Date(last.at);

    await convCol.updateOne(
      { waId: chat.waId },
      {
        $set: {
          waId: chat.waId,
          profileName: "",
          lastMessageAt: lastAt,
          lastMessagePreview: String(last.body).slice(0, 80),
          lastDirection: last.direction,
          unreadCount: chat.unreadCount,
          inboxStatus: chat.inboxStatus,
          origin: "cloud",
          assignedAgentId: "",
          assignedAgentName: "",
          updatedAt: new Date(),
        },
        $setOnInsert: { createdAt: lastAt },
      },
      { upsert: true },
    );

    const conversation = await convCol.findOne({ waId: chat.waId });

    for (const m of chat.messages) {
      const wamid = `seed:${chat.waId}:${m.at}:${m.direction}:${m.body.slice(0, 24)}`;
      const existing = await msgCol.findOne({ wamid });
      if (existing) continue;

      const at = new Date(m.at);
      await msgCol.insertOne({
        conversationId: conversation._id,
        waId: chat.waId,
        direction: m.direction,
        type: "text",
        body: m.body,
        wamid,
        status: m.status || (m.direction === "inbound" ? "delivered" : "sent"),
        raw: { source: "seed_live_history" },
        createdAt: at,
        updatedAt: at,
      });
    }
    console.log("seeded", chat.waId, chat.messages.length, "messages");
  }

  await mongoose.disconnect();
  console.log("done");
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
