require("dotenv").config();
const mongoose = require("mongoose");

(async () => {
  await mongoose.connect(process.env.MONGO_URI, {
    dbName: process.env.MONGO_DB_NAME || "propenu",
  });
  const db = mongoose.connection.db;
  const cols = await db.listCollections().toArray();
  console.log(
    "collections:",
    cols.map((c) => c.name).sort().join("\n"),
  );

  const interesting = cols
    .map((c) => c.name)
    .filter((n) =>
      /chat|conv|message|whatsapp|inbox|flow|session|thread|bot/i.test(n),
    );

  for (const name of interesting) {
    const count = await db.collection(name).countDocuments();
    const sample = await db.collection(name).find({}).sort({ _id: -1 }).limit(1).toArray();
    console.log("\n==", name, "count", count);
    console.log(JSON.stringify(sample[0], null, 2)?.slice(0, 500));
  }

  // search for phone from screenshot
  const phones = ["917680914066", "919008211355", "917973995252"];
  for (const col of cols.map((c) => c.name)) {
    for (const phone of phones) {
      try {
        const hit = await db.collection(col).findOne({
          $or: [
            { waId: phone },
            { phone },
            { from: phone },
            { to: phone },
            { number: phone },
            { mobile: phone },
            { "contact.phone": phone },
            { customerPhone: phone },
          ],
        });
        if (hit) {
          console.log("\nFOUND", phone, "in", col);
          console.log(JSON.stringify(hit, null, 2).slice(0, 400));
        }
      } catch {}
    }
  }

  await mongoose.disconnect();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
