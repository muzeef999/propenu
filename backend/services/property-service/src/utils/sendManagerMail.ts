import nodemailer from "nodemailer";

/* =========================================================
   1️⃣ ENV CHECK
========================================================= */

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`❌ Missing ENV variable: ${name}`);
  return v;
}

/* =========================================================
   2️⃣ CREATE SMTP TRANSPORT
========================================================= */

function createTransport() {
  const host = requireEnv("SMTP_HOST");
  const port = Number(requireEnv("SMTP_PORT"));
  const user = requireEnv("SMTP_USER");
  const pass = requireEnv("SMTP_PASS");

  console.log("📡 SMTP CONFIG:", { host, port, user });

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    tls: { rejectUnauthorized: false },
  });
}

/* =========================================================
   3️⃣ EMAIL TEMPLATE
========================================================= */

function managerApprovalTemplate({
  property,
  agent,
  approveUrl,
  rejectUrl,
  viewUrl,
}: any) {
  return `
  <div style="font-family:Arial;background:#f4f6f8;padding:20px">

    <div style="max-width:650px;margin:auto;background:white;
                border-radius:10px;padding:20px">

      <h2 style="margin-top:0;color:#333">🏠 Property Approval Needed</h2>
      <p style="color:#555">
        A sales agent submitted a property. Please review.
      </p>

      <!-- AGENT -->
      <div style="background:#fafafa;border-radius:8px;padding:15px;margin-top:20px">
        <h3>👤 Sales Agent</h3>
        <p><b>Name:</b> ${agent?.name || "-"}</p>
        <p><b>Email:</b> ${agent?.email || "-"}</p>
      </div>

       <table width="100%" cellpadding="0" cellspacing="0"
         style="background:#fafafa;border-radius:10px;margin-top:20px;padding:15px">
    <tr>

      <!-- LEFT IMAGE -->
      <td width="40%" valign="top" style="padding-right:15px">
        ${
          property?.image
            ? `<img src="${property.image}"
                 style="width:100%;border-radius:8px;display:block"/>`
            : `<div style="
                 width:100%;
                 height:160px;
                 background:#ddd;
                 border-radius:8px;
                 text-align:center;
                 line-height:160px;
                 color:#666;
                 font-size:14px">
                 No Image
               </div>`
        }
      </td>

      <!-- RIGHT CONTENT -->
      <td width="60%" valign="top" style="font-family:Arial,sans-serif;color:#333">

        <h3 style="margin:0 0 10px 0;color:#222">
          🏠 Property Details
        </h3>

        <p style="margin:4px 0">
          <b>Title:</b> ${property?.title || "-"}
        </p>

        <p style="margin:4px 0">
          <b>ID:</b> ${property?.id}
        </p>

        <p style="margin:4px 0">
          <b>Location:</b> ${property?.locality || "-"}, ${property?.city || "-"}
        </p>

        <p style="margin:4px 0">
          <b>Price:</b> ₹ ${property?.price || "-"}
        </p>

        <p style="margin:4px 0">
          <b>Bedrooms:</b> ${property?.bedrooms || "-"} |
          <b>Area:</b> ${property?.area || "-"} sq.ft
        </p>

      </td>

    </tr>
  </table>
  

      <!-- BUTTONS -->
      <div style="margin-top:25px;text-align:center">

        <a href="${approveUrl}"
           style="background:#28a745;color:white;
                  padding:12px 20px;border-radius:6px;
                  text-decoration:none;margin-right:10px">
          ✅ Approve
        </a>

        <a href="${rejectUrl}"
           style="background:#dc3545;color:white;
                  padding:12px 20px;border-radius:6px;
                  text-decoration:none;margin-right:10px">
          ❌ Reject
        </a>

        <a href="${viewUrl}"
           style="background:#0a66c2;color:white;
                  padding:12px 20px;border-radius:6px;
                  text-decoration:none">
          🔍 View Property
        </a>

      </div>

      <p style="margin-top:30px;color:#666">
        Regards,<br/>
        <b>Propenu Team</b>
      </p>

    </div>
  </div>
  `;
}

/* =========================================================
   4️⃣ SEND MAIL FUNCTION
========================================================= */

export async function sendManagerApprovalMail({
  managerEmail,
  property,
  agent,
  token,
}: any) {
  try {
    if (!managerEmail) throw new Error("Manager email missing");

    console.log("📧 Sending approval mail to:", managerEmail);

    const transporter = createTransport();

    // Debug SMTP connection
    await transporter.verify();
    console.log("✅ SMTP Connected");

    const approveUrl =
      `${process.env.FRONTEND_URL}/approve/${property.id}?token=${token}`;

    const rejectUrl =
      `${process.env.FRONTEND_URL}/reject/${property.id}?token=${token}`;

    const viewUrl =
      `${process.env.FRONTEND_URL}/property/${property.id}`;

    const html = managerApprovalTemplate({
      property,
      agent,
      approveUrl,
      rejectUrl,
      viewUrl,
    });

    const info = await transporter.sendMail({
      from: process.env.MAIL_FROM || process.env.SMTP_USER,
      to: managerEmail,
      subject: `Property Approval Needed – ${property.title}`,
      html,
    });

    console.log("📩 Mail sent:", info.messageId);
    return info;

  } catch (err: any) {
    console.error("❌ MAIL ERROR:", err?.message || err);
    throw err;
  }
}
