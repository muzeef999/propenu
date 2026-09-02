require("dotenv").config();
const mongoose = require("mongoose");

(async () => {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  await mongoose.connect(uri, { dbName: process.env.MONGO_DB_NAME || "propenu" });
  const db = mongoose.connection.db;

  for (const n of ["whatsappconversations", "whatsappmessages", "whatsapplogs"]) {
    try {
      const c = db.collection(n);
      const count = await c.countDocuments();
      const sample = await c
        .find({})
        .sort({ updatedAt: -1 })
        .limit(5)
        .project({
          waId: 1,
          origin: 1,
          lastMessagePreview: 1,
          lastMessageAt: 1,
          profileName: 1,
          unreadCount: 1,
          direction: 1,
          body: 1,
          wamid: 1,
          createdAt: 1,
          "raw.source": 1,
        })
        .toArray();
      console.log("\n==", n, "count", count);
      console.log(JSON.stringify(sample, null, 2));
    } catch (e) {
      console.log(n, e.message);
    }
  }

  const byOrigin = await db
    .collection("whatsappconversations")
    .aggregate([{ $group: { _id: "$origin", n: { $sum: 1 } } }])
    .toArray();
  console.log("\norigin breakdown", byOrigin);

  await mongoose.disconnect();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
