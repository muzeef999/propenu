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

import { sendTemplateMessage } from "../../../../shared/whatsapp/whatsapp.service";
import { WHATSAPP_TEMPLATES } from "../../../../shared/whatsapp/whatsapp.templates";
import { sendWelcomeEmail } from "../utils/email";

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

    console.log("👉 Query Params:", { code, state });

    console.log("👉 FRONTEND_URL:", process.env.FRONTEND_URL);

    if (!code || !state) {
      return res.status(400).json({ message: "Missing code/state" });
    }

    // state = userId
    const token = await exchangeToken(code, state);
    const docs = await fetchDocuments(token.access_token);

    const profile = await fetchProfile(token.access_token);

    const docTypes = docs.items?.map((d: any) => d.name) || [];

    const user = await User.findById(state);

    if (!user) {
      throw new Error("User not found");
    }

    const appPhone = normalizePhone(user.phone ?? undefined);
    const kycPhone = normalizePhone(profile.mobile ?? undefined);

     console.log("📱 App Phone:", appPhone);
    console.log("📱 KYC Phone:", kycPhone);

    if (appPhone !== kycPhone) {
       console.log("❌ Phone mismatch → KYC REJECTED");
      await User.findByIdAndUpdate(state, {
        "kyc.status": "rejected",
        "kyc.remarks": "Phone number mismatch",
      });

      return res.redirect(`${process.env.FRONTEND_URL}?kyc=rejected`);
    }


    console.log("✅ Phone matched → KYC VERIFIED");

    const updatedUser = await User.findByIdAndUpdate(
      state,
      {
        $set: {
          "kyc.status": "verified",
          "kyc.provider": "digilocker",
          "kyc.documents": docTypes,
          "kyc.verifiedAt": new Date(),
          accountStatus: "active",
        },
      },
      { new: true },
    ).populate("roleId");

        console.log("✅ Updated User:", updatedUser);


    // 📧 Send Welcome Email after KYC verified
    // 📧 Send Welcome Email
    try {
      if (updatedUser?.email && updatedUser?.name) {
        console.log("📧 Sending welcome email...");
        await sendWelcomeEmail(updatedUser.email, updatedUser.name);
        console.log("✅ Welcome email sent");
      }
    } catch (err) {
      console.error("⚠️ Welcome email failed:", err);
    }

    // ✅ REDIRECT TO FRONTEND SETTINGS PAGE
    // return res.redirect(`${process.env.FRONTEND_URL}/settings?kyc=success`);

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

    return res.redirect(
      `${process.env.FRONTEND_URL}/?token=${jwtToken}&kyc=verified`,
    );
  } catch (err) {
    console.error("KYC Error:", err);
    return res.redirect(`${process.env.FRONTEND_URL}?kyc=failed`);
  }
};



function normalizePhone(phone?: string) {
  if (!phone) return "";
  return phone.replace(/\D/g, "").slice(-10);
}