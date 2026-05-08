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
import { sendWelcomeEmail } from "../utils/email";
import stringSimilarity from "string-similarity";

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

const createKycRetryToken = (user: any, role: any) =>
  generateToken({
    sub: String(user._id),
    email: user.email,
    phone: user.phone ? Number(user.phone) : undefined,
    name: user.name ?? "",
    roleId: role ? String(role._id) : undefined,
    roleName: role ? role.name : undefined,
    permissions: role ? role.permissions : [],
    accountStatus: user.accountStatus,
  });

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

export const updateKycDetails = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.sub) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const allowedUpdates = [
      "name",
      "email",
      "address",
      "locality",
      "city",
      "state",
      "pincode",
    ];
    const updates: Record<string, unknown> = {};

    for (const key of allowedUpdates) {
      if (req.body[key] !== undefined) {
        if (typeof req.body[key] !== "string") {
          return res.status(400).json({ message: `${key} must be a string` });
        }

        const cleaned = req.body[key].trim();

        if (!cleaned) {
          return res.status(400).json({ message: `${key} cannot be empty` });
        }

        updates[key] = key === "email" ? cleaned.toLowerCase() : cleaned;
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "No valid fields to update" });
    }

    const user = await User.findById(req.user.sub);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.kyc?.status === "verified") {
      return res.status(409).json({
        message: "KYC is already verified. Details cannot be reset for retry.",
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.sub,
      {
        $set: {
          ...updates,
          accountStatus: "kyc_pending",
          "kyc.status": "not_started",
          "kyc.provider": "digilocker",
          "kyc.documents": [],
          "kyc.remarks": "Details updated. Please retry KYC.",
        },
        $unset: {
          "kyc.verifiedName": "",
          "kyc.verifiedPhone": "",
          "kyc.verifiedDob": "",
          "kyc.digilockerId": "",
          "kyc.verifiedAt": "",
        },
      },
      { new: true, runValidators: true },
    ).populate("roleId");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const role: any = updatedUser.roleId;
    const token = createKycRetryToken(updatedUser, role);

    return res.status(200).json({
      message: "KYC details updated. Please retry KYC.",
      token,
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        accountStatus: updatedUser.accountStatus,
        address: updatedUser.address,
        locality: updatedUser.locality,
        city: updatedUser.city,
        state: updatedUser.state,
        pincode: updatedUser.pincode,
        roleId: role ? String(role._id) : null,
        roleName: role ? role.name : null,
        permissions: role ? role.permissions : [],
        kyc: {
          status: updatedUser.kyc?.status,
          provider: updatedUser.kyc?.provider,
          documents: updatedUser.kyc?.documents ?? [],
          remarks: updatedUser.kyc?.remarks,
        },
      },
    });
  } catch (error: any) {
    console.error("Update KYC details error:", error);

    if (error?.code === 11000 && error?.keyPattern?.email) {
      return res.status(409).json({
        message: "Email already exists. Please use a different email.",
      });
    }

    if (error?.name === "ValidationError") {
      return res.status(400).json({
        message: "Invalid user details",
        error: error.message,
      });
    }

    return res.status(500).json({ message: "Failed to update KYC details" });
  }
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
