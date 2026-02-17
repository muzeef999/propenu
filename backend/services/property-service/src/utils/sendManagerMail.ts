import nodemailer from "nodemailer";

/* ================================
   1️⃣ ENV CHECK
================================ */

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`❌ Missing ENV variable: ${name}`);
  return value;
}

/* ================================
   2️⃣ CREATE SMTP TRANSPORT
================================ */

function createTransport() {
  const host = requireEnv("SMTP_HOST");
  const port = Number(requireEnv("SMTP_PORT"));
  const user = requireEnv("SMTP_USER");
  const pass = requireEnv("SMTP_PASS");

  console.log("📡 SMTP Config:", { host, port, user });

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // Zoho SSL
    auth: { user, pass },
    tls: { rejectUnauthorized: false }, // Fix connection closed errors
  });
}

/* ================================
   3️⃣ MAIL TEMPLATE
================================ */

function managerApprovalTemplate(
  propertyId: string,
  approveUrl: string
) {
  return `
  <div style="font-family: Arial, sans-serif; padding:20px">
    <h2 style="color:#333;">🏠 Property Approval Needed</h2>

    <p>A sales agent submitted a property.</p>

    <p><b>Property ID:</b> ${propertyId}</p>

    <a href="${approveUrl}"
       style="
         background:#0a66c2;
         color:white;
         padding:12px 18px;
         text-decoration:none;
         border-radius:6px;
         display:inline-block;
         margin-top:15px;
       ">
       Approve Property
    </a>

    <p style="margin-top:30px;">
      Regards,<br/>
      <b>Propenu Team</b>
    </p>
  </div>
  `;
}

/* ================================
   4️⃣ SEND MAIL FUNCTION
================================ */

export async function sendManagerApprovalMail({
  managerEmail,
  propertyId,
  token,
}: {
  managerEmail: string;
  propertyId: string;
  token: string;
}) {
  try {
    console.log("📧 Sending mail to:", managerEmail);

    if (!managerEmail) {
      throw new Error("Manager email missing");
    }

    const transporter = createTransport();

    // ⭐ Debug SMTP
    await transporter.verify();
    console.log("✅ SMTP Connected");

    const approveUrl =
      `${process.env.FRONTEND_URL}/approve/${propertyId}?token=${token}`;

    const html = managerApprovalTemplate(propertyId, approveUrl);

    const info = await transporter.sendMail({
      from: process.env.MAIL_FROM || process.env.SMTP_USER,
      to: managerEmail,
      subject: "Property Approval Required - Propenu",
      html,
    });

    console.log("📩 Mail Sent:", info.messageId);

    return info;

  } catch (err: any) {
    console.error("❌ Mail Error:", err?.message || err);
    throw err;
  }
}
