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

// export const callbackKyc = async (req: AuthRequest, res: Response) => {
//   try {
//     const { code, state } = req.query as any;

//     console.log("[KYC] Callback received:", { code, state });
//     console.log("[KYC] FRONTEND_URL:", process.env.FRONTEND_URL);

//     if (!code || !state) {
//       return res.status(400).json({ message: "Missing code/state" });
//     }

//     // state = userId
//     const token = await exchangeToken(code, state);
//     const docs = await fetchDocuments(token.access_token);

//     const profile = await fetchProfile(token.access_token);

//     const docTypes = docs.items?.map((d: any) => d.name) || [];
//     console.log("[KYC] Documents fetched:", docTypes);

//     const user = await User.findById(state);

//     if (!user) {
//       throw new Error("User not found");
//     }

//     const appPhone = normalizePhone(user.phone ?? undefined);
//     const kycPhone = normalizePhone(profile.mobile ?? undefined);

//     console.log("[KYC] App phone:", appPhone);
//     console.log("[KYC] DigiLocker phone:", kycPhone);

//     if (appPhone !== kycPhone) {
//       console.log("[KYC] Phone mismatch. Marking KYC as rejected.");
//       await User.findByIdAndUpdate(state, {
//         "kyc.status": "rejected",
//         "kyc.remarks": "Phone number mismatch",
//       });

//       return res.redirect(`${process.env.FRONTEND_URL}?kyc=rejected`);
//     }


//     console.log("[KYC] Phone matched. Marking KYC as verified.");

//     const updatedUser = await User.findByIdAndUpdate(
//       state,
//       {
//         $set: {
//           "kyc.status": "verified",
//           "kyc.provider": "digilocker",
//           "kyc.documents": docTypes,
//           "kyc.verifiedAt": new Date(),
//           accountStatus: "active",
//         },
//       },
//       { new: true },
//     ).populate("roleId");

//     console.log("[KYC] User updated after verification:", {
//       userId: updatedUser?._id,
//       accountStatus: updatedUser?.accountStatus,
//       kycStatus: updatedUser?.kyc?.status,
//     });


//     try {
//       if (updatedUser?.email && updatedUser?.name) {
//         console.log("[KYC] Sending welcome email:", {
//           email: updatedUser.email,
//           name: updatedUser.name,
//         });
//         await sendWelcomeEmail(updatedUser.email, updatedUser.name);
//         console.log("[KYC] Welcome email sent successfully.");
//       } else {
//         console.log("[KYC] Skipping welcome email. Missing email or name.");
//       }
//     } catch (err) {
//       console.error("[KYC] Welcome email failed:", err);
//     }

//     try {
//       if (updatedUser?.phone && updatedUser?.name) {
//         const role: any = updatedUser?.roleId;
//         const whatsappEvent = getVerifiedWhatsAppEvent(role?.name);

//         console.log("[KYC] Sending WhatsApp template:", {
//           event: whatsappEvent,
//           phone: updatedUser.phone,
//           parameters: [updatedUser.name],
//         });

//         const whatsappResult = await sendWhatsAppEvent(
//           whatsappEvent,
//           updatedUser.phone,
//           [updatedUser.name],
//         );

//         if (whatsappResult.status === "error") {
//           console.error("[KYC] WhatsApp template failed:", whatsappResult.reason);
//         } else {
//           console.log("[KYC] WhatsApp template sent successfully.");
//         }
//       } else {
//         console.log("[KYC] Skipping WhatsApp template. Missing phone or name.");
//       }
//     } catch (err) {
//       console.error("[KYC] WhatsApp error:", err);
//     }

//     const role: any = updatedUser?.roleId;

//     const jwtToken = generateToken({
//       sub: String(updatedUser?._id),
//       email: updatedUser?.email,
//       phone: Number(updatedUser?.phone),
//       name: updatedUser?.name ?? "",
//       roleId: role ? String(role._id) : undefined,
//       roleName: role ? role.name : undefined,
//       permissions: role ? role.permissions : [],
//     });

//     console.log("[KYC] Redirecting verified user to frontend.");
//     return res.redirect(
//       `${process.env.FRONTEND_URL}/?token=${jwtToken}&kyc=verified`,
//     );
//   } catch (err) {
//     console.error("[KYC] Callback failed:", err);
//     return res.redirect(`${process.env.FRONTEND_URL}?kyc=failed`);
//   }
// };


export const callbackKyc = async (req: AuthRequest, res: Response) => {
  try {
    const { code, state } = req.query as any;

    console.log("[KYC] Callback received:", { code, state });
    console.log("[KYC] FRONTEND_URL:", process.env.FRONTEND_URL);

    if (!code || !state) {
      return res.status(400).json({ message: "Missing code/state" });
    }

    // 🔐 Exchange token
    const token = await exchangeToken(code, state);

    // 📄 Fetch documents
    const docs = await fetchDocuments(token.access_token);

    // 👤 Fetch profile
    const profile = await fetchProfile(token.access_token);

    const docTypes = docs.items?.map((d: any) => d.name) || [];
    console.log("[KYC] Documents fetched:", docTypes);

    const user = await User.findById(state);

    if (!user) {
      throw new Error("User not found");
    }

    const appPhone = normalizePhone(user.phone ?? undefined);
    const kycPhone = normalizePhone(profile.mobile ?? undefined);

    console.log("[KYC] App phone:", appPhone);
    console.log("[KYC] DigiLocker phone:", kycPhone);

    let status = "success";

    // ❌ Phone mismatch → reject
    if (appPhone !== kycPhone) {
      console.log("[KYC] Phone mismatch. Marking KYC as rejected.");

      await User.findByIdAndUpdate(state, {
        "kyc.status": "rejected",
        "kyc.remarks": "Phone number mismatch",
      });

      status = "rejected";
    } else {
      console.log("[KYC] Phone matched. Marking KYC as verified.");

      await User.findByIdAndUpdate(state, {
        "kyc.status": "verified",
        "kyc.remarks": "KYC successful",
        "kyc.documents": docTypes,
      });

      status = "success";
    }

    // 🔥 IMPORTANT PART (APP REDIRECT FIX)

    const FRONTEND_URL = process.env.FRONTEND_URL || "https://propenu.com";

    // 📱 App deep link (must match your app config)
    const appDeepLink = `propenu://kyc?status=${status}`;

    // 🌐 Web fallback
    const webUrl = `${FRONTEND_URL}?kyc=${status}`;

    console.log("[KYC] Redirecting:", { appDeepLink, webUrl });

    // ✅ Send HTML (NOT res.redirect)
    return res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Redirecting...</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <script>
            // Try to open mobile app
            window.location.href = "${appDeepLink}";

            // Fallback to website after delay
            setTimeout(function () {
              window.location.href = "${webUrl}";
            }, 1500);
          </script>
        </head>
        <body style="font-family: sans-serif; text-align:center; padding-top:50px;">
          <h3>Redirecting...</h3>
          <p>If nothing happens, <a href="${webUrl}">click here</a>.</p>
        </body>
      </html>
    `);
  } catch (error: any) {
    console.error("[KYC] Callback error:", error);

    const FRONTEND_URL = process.env.FRONTEND_URL || "https://propenu.com";

    return res.redirect(`${FRONTEND_URL}?kyc=error`);
  }
};


function normalizePhone(phone?: string) {
  if (!phone) return "";
  return phone.replace(/\D/g, "").slice(-10);
}
