import path from "path";
import fs from "fs";
import admin from "firebase-admin";

// ✅ Always resolve from PROJECT ROOT
const serviceAccountPath = path.resolve(
  process.cwd(),
  "backend/firebase-service-account.json"
);

console.log("Firebase Path:", serviceAccountPath);

// ✅ Check file exists (extra safety)
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