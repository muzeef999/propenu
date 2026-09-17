import path from "path";
import fs from "fs";
import admin from "firebase-admin";
import dotenv from "dotenv";
dotenv.config();

const parseServiceAccount = () => {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  }

  const relativePath =
    process.env.FIREBASE_KEY_PATH || "backend/firebase-service-account.json";
  const serviceAccountPath = path.resolve(process.cwd(), relativePath);

  console.log("Firebase Path:", serviceAccountPath);

  if (!fs.existsSync(serviceAccountPath)) {
    console.warn(
      "Firebase service account file not found. Push notifications are disabled until FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_KEY_PATH is configured.",
    );
    return null;
  }

  return JSON.parse(fs.readFileSync(serviceAccountPath, "utf-8"));
};

if (!admin.apps.length) {
  const serviceAccount = parseServiceAccount();

  if (serviceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }
}

export default admin;
