import nodemailer from "nodemailer";
import { sendEmail } from "../../../../shared/email/email.service";
import {
  agentWelcomeEmail,
  agentWelcomeEmailSubject,
} from "../../../../shared/email/templates/agentTemplates/email.templates";
import {
  buyerWelcomeEmail,
  buyerWelcomeEmailSubject,
} from "../../../../shared/email/templates/buyTemplates/email.templates";
import {
  ownerWelcomeEmail,
  ownerWelcomeEmailSubject,
} from "../../../../shared/email/templates/ownerTemplates/email.templates";

const TTL = Number(process.env.OTP_TTL_SECONDS || 300);

const ttlInSeconds = Number(process.env.OTP_TTL_SECONDS || 300);
const ttlInMinutes = Math.floor(ttlInSeconds / 60);

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

function createTransport() {
  const host = requireEnv("SMTP_HOST");
  const port = Number(process.env.SMTP_PORT || 587);
  const user = requireEnv("SMTP_USER");
  const pass = requireEnv("SMTP_PASS");

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

function makeOtpHtml(otp: string) {
  return `
  <div>
    <h2 style={{ color: "#000", marginBottom: "16px" }}>Hi,</h2>
    <p style="font-size: 15px; color: #000;">Use the following one-time password (OTP) to sign in to your Propenu account.<br/>
    This OTP will be valid for 15 minutes till <b>${ttlInMinutes} seconds</b>.</p>
    <div style="font-size: 32px; letter-spacing: 6px; font-weight: bold; margin: 20px 0; padding: 12px 16px; border: 2px dashed #333; display: inline-block;">
      ${otp}
    </div>
    <p style="color: #000;">
  For future clarifications, please contact
  <a href="mailto:support@propenu.com" style="color: #007bff; text-decoration: none;">
    support@propenu.com.
  </a>
</p>
<p style="color: #000; margin: 16px 0 4px;">Regards,</p>
<p style="color: #000; font-weight: bold; margin: 0;">The Propenu Team</p>
<a href="https://www.propenu.com" target="_blank"
   style="color: #007bff; text-decoration: none; font-size: 14px;">
   www.propenu.com
</a>

  </div>`;
}

function makeOtpText(otp: string) {
  return `Your verification code is ${otp}. It expires in ${TTL} seconds.`;
}

export async function sendOtpEmail(to: string, otp: string) {
  const transporter = createTransport();

  await transporter.verify().catch((e) => {
    console.error("SMTP verify failed:", e?.response || e?.message, e);
    throw e;
  });

  try {
    const info = await transporter.sendMail({
      from: process.env.MAIL_FROM || process.env.SMTP_USER,
      to,
      subject: "Your verification code",
      text: makeOtpText(otp),
      html: makeOtpHtml(otp),
    });

    console.log(`OTP email sent to ${to} (id: ${info.messageId})`);
    return info;
  } catch (err: any) {
    console.error("sendMail error:", err?.response || err?.message, err);
    throw err;
  }
}

export async function sendWelcomeEmail(to: string, name: string) {
  return sendEmail(to, ownerWelcomeEmailSubject(name), ownerWelcomeEmail(name));
}

export async function sendOwnerSignupEmail(to: string, name: string) {
  return sendWelcomeEmail(to, name);
}

export async function sendBuyerSignupEmail(to: string, name: string) {
  return sendEmail(to, buyerWelcomeEmailSubject(name), buyerWelcomeEmail(name));
}

export async function sendAgentSignupEmail(to: string, name: string) {
  return sendEmail(to, agentWelcomeEmailSubject(name), agentWelcomeEmail(name));
}

export async function sendSignupEmailByRole(
  to: string,
  name: string,
  roleName: string,
) {
  if (roleName === "user") {
    return sendBuyerSignupEmail(to, name);
  }

  if (roleName === "agent") {
    return sendAgentSignupEmail(to, name);
  }

  return sendOwnerSignupEmail(to, name);
}
