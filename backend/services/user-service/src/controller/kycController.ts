import { Response } from "express";
import User from "../models/userModel";
import { AuthRequest } from "../middlewares/authMiddleware";
import {
  exchangeToken,
  fetchDocuments,
  fetchProfile,
  saveVerifier,
} from "../services/kycService";
import crypto from "crypto";
import { generateToken } from "../utils/jwt";
import { sendWhatsAppEvent } from "../../../../shared/whatsapp/whatsapp.helper";
import { sendSignupEmailByRole, sendWelcomeEmail } from "../utils/email";
import stringSimilarity from "string-similarity";

function normalizePhone(phone?: string) {
  if (!phone) return "";
  return phone.replace(/\D/g, "").slice(-10);
}

function normalizeName(name?: string) {
  if (!name) return "";
  return name
    .toLowerCase()
    .replace(/[^a-z\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenScore(a: string, b: string) {
  const A = normalizeName(a).split(" ");
  const B = normalizeName(b).split(" ");

  const setA = new Set(A);
  const setB = new Set(B);

  const intersection = [...setA].filter((x) => setB.has(x)).length;
  const union = new Set([...A, ...B]).size;

  return intersection / union;
}

function finalScore(a: string, b: string) {
  const token = tokenScore(a, b);
  const fuzzy = stringSimilarity.compareTwoStrings(
    normalizeName(a),
    normalizeName(b),
  );

  return token * 0.6 + fuzzy * 0.4;
}

function getVerifiedWhatsAppEvent(roleName?: string) {
  if (roleName === "user") {
    return "USER_VERIFIED_BUYER" as const;
  }

  if (roleName === "agent" || roleName === "sales_agent") {
    return "USER_VERIFIED_AGENT" as const;
  }

  return "USER_VERIFIED_OWNER" as const;
}

function generatePKCE() {
  const codeVerifier = crypto.randomBytes(32).toString("hex");

  const codeChallenge = crypto
    .createHash("sha256")
    .update(codeVerifier)
    .digest("base64url");

  return { codeVerifier, codeChallenge };
}

export const startKyc = async (req: AuthRequest, res: Response) => {
  if (!req.user?._id) {
    return res.status(401).json({ message: "User not found" });
  }

  const { codeVerifier, codeChallenge } = generatePKCE();

  // save verifier in memory/db
  await saveVerifier(req.user._id, codeVerifier);

  const url =
    "https://digilocker.meripehchaan.gov.in/public/oauth2/1/authorize" +
    "?response_type=code" +
    `&client_id=${process.env.APISETU_CLIENT_ID}` +
    `&redirect_uri=${process.env.APISETU_REDIRECT}` +
    "&scope=openid" +
    `&state=${req.user._id}` +
    `&code_challenge=${codeChallenge}` +
    "&code_challenge_method=S256";
  res.json({ url });
};

export const callbackKyc = async (req: AuthRequest, res: Response) => {
  try {
    const { code, state } = req.query as any;

    if (!code || !state) {
      return res.status(400).json({ message: "Missing code/state" });
    }

    const token = await exchangeToken(code, state);
    const docs = await fetchDocuments(token.access_token);
    const profile = await fetchProfile(token.access_token);
    const docTypes = docs.items?.map((d: any) => d.name) || [];

    const user = await User.findById(state);

    if (!user) {
      throw new Error("User not found");
    }

    const appName = user.name || "";
    const kycName = profile.name || "";

    const score = finalScore(appName, kycName);

    let kycStatus: "verified" | "pending" | "rejected" = "rejected";
    let remarks = "Low match";

    if (score >= 0.8) {
      kycStatus = "verified";
      remarks = "High confidence match";
    } else if (score >= 0.6) {
      kycStatus = "verified";
      remarks = "Partial match (middle name/initial)";
    } else if (score >= 0.4) {
      kycStatus = "pending";
      remarks = "Needs manual review";
    } else {
      kycStatus = "rejected";
      remarks = "Name mismatch";
    }

    const updateData: any = {
      "kyc.status": kycStatus,
      "kyc.provider": "digilocker",
      "kyc.documents": docTypes,
      "kyc.verifiedAt": new Date(),
      "kyc.remarks": remarks,
    };

    // ✅ ONLY set verifiedName if VERIFIED
    if (kycStatus === "verified") {

      updateData["kyc.verifiedName"] = kycName;
      updateData["kyc.verifiedAt"] = new Date();
      updateData["name"] = kycName;
      updateData["accountStatus"] = "active";

    } else if (kycStatus === "pending") {
      updateData["accountStatus"] = "kyc_pending";
    } else {
      updateData["accountStatus"] = "kyc_rejected";
    }

    const updatedUser = await User.findByIdAndUpdate(
      state,
      { $set: updateData },
      { new: true },
    ).populate("roleId");

    if (kycStatus === "verified") {
      try {
        if (updatedUser?.email && updatedUser?.name) {
          await sendWelcomeEmail(updatedUser.email, updatedUser.name);
        }
      } catch (err) {
        return res.status(500).json({ message: "❌ Welcome email failed:", err });
      }

      try {
        if (updatedUser?.phone && updatedUser?.name) {
          const role: any = updatedUser?.roleId;
          const whatsappEvent = getVerifiedWhatsAppEvent(role?.name);

          const whatsappResult = await sendWhatsAppEvent(
            whatsappEvent,
            updatedUser.phone,
            [updatedUser.name],
          );

          if (whatsappResult.status === "error") {
            console.error("❌ WhatsApp failed:", whatsappResult.reason);
          } else {
            console.log("✅ WhatsApp sent successfully");
          }
        }
      } catch (err) {
        console.error("❌ WhatsApp error:", err);
      }
    }

      const role: any = updatedUser?.roleId;

      const jwtToken = generateToken({
        sub: String(updatedUser?._id),
        email: updatedUser?.email,
        phone: Number(updatedUser?.phone),
        name: updatedUser?.name ?? "",
        roleId: role ? String(role._id) : undefined,
        roleName: role ? role.name : undefined,
        permissions: role ? role.permissions : [],
      });
      console.log("🚀 REDIRECT URL:",
  `${process.env.FRONTEND_URL}/?token=${jwtToken}&kyc=${kycStatus}&remark=${encodeURIComponent(remarks)}`
);
      return res.redirect(`${process.env.FRONTEND_URL}/?token=${jwtToken}&kyc=${kycStatus}&remark=${encodeURIComponent(remarks)}`
);
    
  } catch (err) {
    console.error("KYC Error:", err);
    return res.redirect(`${process.env.FRONTEND_URL}?kyc=failed`);
  }
};
