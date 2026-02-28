import { Response } from "express";
import User from "../models/userModel";
import { AuthRequest } from "../middlewares/authMiddleware";
import { exchangeToken, fetchDocuments, saveVerifier } from "../services/kycService";
import crypto from "crypto";


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

    // state = userId
    const token = await exchangeToken(code, state);
    const docs = await fetchDocuments(token.access_token);

    const docTypes = docs.items?.map((d: any) => d.name) || [];

    await User.findByIdAndUpdate(state, {
      $set: {
        "kyc.status": "verified",
        "kyc.provider": "digilocker",
        "kyc.documents": docTypes,
        "kyc.verifiedAt": new Date(),
      },
    });

    // ✅ REDIRECT TO FRONTEND SETTINGS PAGE
    return res.redirect(
      `${process.env.FRONTEND_URL}/settings?kyc=success`
    );

  } catch (err) {
    console.error("KYC Error:", err);

    return res.redirect(
      `${process.env.FRONTEND_URL}/settings?kyc=failed`
    );
  }
};