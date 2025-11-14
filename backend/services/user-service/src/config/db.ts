import mongoose from "mongoose";

const mongoUri = process.env.MONGO_URI;
const dbName = process.env.MONGO_DB_NAME;

export const connectDB = async () => {
  if (!mongoUri) {
    throw new Error("MONGO_URI environment variable is not set");
  }

  if (!dbName) {
    throw new Error("MONGO_DB_NAME environment variable is not set");
  }

  try {
    await mongoose.connect(mongoUri, {
      dbName,
      maxPoolSize: 20,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      retryWrites: true,
      w: "majority",
      appName: "my-app",
    });

    console.log(`✅ MongoDB connected: ${dbName}`);
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1); // stop app if DB fails
  }

  mongoose.connection.on("disconnected", () => {
    console.log("⚠️ MongoDB disconnected");
  });
};
