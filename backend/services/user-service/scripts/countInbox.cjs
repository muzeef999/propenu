require("dotenv").config();
const mongoose = require("mongoose");

(async () => {
  await mongoose.connect(process.env.MONGO_URI, {
    dbName: process.env.MONGO_DB_NAME || "propenu",
  });
  const list = await mongoose.connection.db
    .collection("whatsappconversations")
    .find({})
    .sort({ lastMessageAt: -1 })
    .limit(80)
    .toArray();
  console.log("visible count", list.length);
  console.log(
    list.slice(0, 3).map((c) => ({
      waId: c.waId,
      origin: c.origin,
      preview: c.lastMessagePreview,
    })),
  );
  await mongoose.disconnect();
})();
