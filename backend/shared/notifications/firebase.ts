import path from "path";
import fs from "fs";
import admin from "firebase-admin";
import dotenv from "dotenv";
dotenv.config();

const relativePath = process.env.FIREBASE_KEY_PATH || "backend/firebase-service-account.json";

const serviceAccountPath = path.resolve(process.cwd(), relativePath);

console.log("Firebase Path:", serviceAccountPath);

if (!fs.existsSync(serviceAccountPath)) {
  throw new Error("Firebase service account file NOT FOUND");
}

const serviceAccount = JSON.parse(
  fs.readFileSync(serviceAccountPath, "utf-8")
);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export default admin;