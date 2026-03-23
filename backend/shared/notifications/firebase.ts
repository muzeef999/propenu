import path from "path";
import fs from "fs";
import admin from "firebase-admin";

// ✅ Go 3 levels up from shared folder → reach backend root
const serviceAccountPath = path.resolve(
  __dirname,
  "../../firebase-service-account.json"
);

// ✅ Debug (optional)
console.log("Firebase Path:", serviceAccountPath);

// ✅ Read file safely
const serviceAccount = JSON.parse(
  fs.readFileSync(serviceAccountPath, "utf-8")
);

// ✅ Initialize Firebase
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export default admin;