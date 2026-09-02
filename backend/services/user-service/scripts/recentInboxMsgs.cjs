require("dotenv").config();
const mongoose = require("mongoose");

(async () => {
  await mongoose.connect(process.env.MONGO_URI, {
    dbName: process.env.MONGO_DB_NAME || "propenu",
  });
  const recent = await mongoose.connection.db
    .collection("whatsappmessages")
    .find({})
    .sort({ createdAt: -1 })
    .limit(15)
    .project({
      waId: 1,
      direction: 1,
      body: 1,
      createdAt: 1,
      "raw.source": 1,
      wamid: 1,
      status: 1,
    })
    .toArray();
  console.log(JSON.stringify(recent, null, 2));
  await mongoose.disconnect();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
