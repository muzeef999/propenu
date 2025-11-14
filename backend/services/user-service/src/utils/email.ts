import nodemailer from "nodemailer";

const TTL = Number(process.env.OTP_TTL_SECONDS || 300);

const ttlInSeconds = Number(process.env.OTP_TTL_SECONDS || 300); // example
const ttlInMinutes = Math.floor(ttlInSeconds / 60);


function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

function createTransport() {
  const host = requireEnv("SMTP_HOST");            // smtp.gmail.com
  const port = Number(process.env.SMTP_PORT || 587); // 465 for SSL, 587 for STARTTLS
  const user = requireEnv("SMTP_USER");            // your gmail
  const pass = requireEnv("SMTP_PASS");            // gmail app password

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // Gmail: 465 = SSL (secure true), 587 = STARTTLS (secure false)
    auth: { user, pass },
  });
}

function makeOtpHtml(otp: string, name:string) {
  return `
  <div>
    <h2 style={{ color: "#000", marginBottom: "16px" }}>Hi ${name} !</h2>
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

export async function sendOtpEmail(to: string, otp: string, name: string) {
  const transporter = createTransport();

  // Verify connection & auth (great for debugging)
  await transporter.verify().catch((e) => {
    console.error("SMTP verify failed:", e?.response || e?.message, e);
    throw e;
  });

  try {
    const info = await transporter.sendMail({
      from: process.env.MAIL_FROM || process.env.SMTP_USER, // keep it as your Gmail unless alias is verified
      to,
      subject: "Your verification code",
      text: makeOtpText(otp),
      html: makeOtpHtml(otp, name),
      // replyTo: "support@propenu.com", // optional
    });

    console.log(`📩 OTP email sent to ${to} (id: ${info.messageId})`);
    return info;
  } catch (err: any) {
    console.error("sendMail error:", err?.response || err?.message, err);
    throw err;
  }
}


function makeWelcomeHtml(name: string) {
  const brand = process.env.BRAND_NAME || "Propenu";
  const appUrl = process.env.APP_URL || "https://www.propenu.com";
  const support = process.env.MAIL_SUPPORT || "support@propenu.com";
  return `
  <div style="font-family: Arial, Helvetica, sans-serif; color: #111;">
    <h2 style="margin: 0 0 12px 0;">Welcome to ${brand}, ${name} 🎉</h2>
    <p style="font-size: 15px; line-height: 1.6; margin: 0 0 12px 0;">
      Your account has been created successfully. You can now sign in and start using ${brand}.
    </p>
    <p style="margin: 16px 0;">
      <a href="${appUrl}" target="_blank"
         style="background:#111;color:#fff;text-decoration:none;padding:10px 16px;border-radius:6px;display:inline-block;">
        Open ${brand}
      </a>
    </p>
    <p style="font-size: 14px; line-height: 1.6; margin: 12px 0;">
      Questions? We’re here to help —
      <a href="mailto:${support}" style="color:#0a66c2;text-decoration:none;">${support}</a>
    </p>
    <p style="font-size: 13px; margin: 16px 0 4px;">Cheers,</p>
    <p style="font-size: 13px; font-weight: bold; margin: 0;">The ${brand} Team</p>
  </div>`;
}

function makeWelcomeText(name: string) {
  const brand = process.env.BRAND_NAME || "Propenu";
  const appUrl = process.env.APP_URL || "https://www.propenu.com";
  return `Welcome to ${brand}, ${name}! Your account is ready. Get started: ${appUrl}`;
}

export async function sendWelcomeEmail(to: string, name: string) {
  const transporter = createTransport();
  // transporter.verify() optional here if already verified earlier

  return transporter.sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    to,
    subject: "Welcome to Propenu 🎉",
    text: makeWelcomeText(name),
    html: makeWelcomeHtml(name),
    replyTo: process.env.MAIL_SUPPORT || process.env.MAIL_FROM,
    headers: {
      "List-Unsubscribe": `<mailto:${process.env.MAIL_SUPPORT || "support@propenu.com"}>`,
      "X-Entity-Type": "transactional",
    },
  });
}
