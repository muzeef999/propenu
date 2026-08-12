import nodemailer from "nodemailer";

type MarketingSendEmailParams = {
  to: string;
  subject: string;
  html: string;
};

/** Prefer marketing SMTP_*_MARK when set; otherwise use main SMTP_* (already in env). */
const envFirst = (...names: string[]) => {
  for (const name of names) {
    const value = process.env[name];
    if (value != null && String(value).trim() !== "") {
      return String(value).trim();
    }
  }
  return "";
};

const requireAny = (...names: string[]) => {
  const value = envFirst(...names);
  if (!value) {
    throw new Error(`Missing ENV variable: ${names.join(" or ")}`);
  }
  return value;
};

const createMarketingTransporter = () => {
  const host = requireAny("SMTP_HOST_MARK", "SMTP_HOST");
  const port = Number(requireAny("SMTP_PORT_MARK", "SMTP_PORT"));
  const user = requireAny("SMTP_USER_MARK", "SMTP_USER");
  const pass = requireAny("SMTP_PASS_MARK", "SMTP_PASS");

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
};

export async function sendMarketingEmail({
  to,
  subject,
  html,
}: MarketingSendEmailParams) {
  const transporter = createMarketingTransporter();
  await transporter.verify();

  const from =
    envFirst("MAIL_FROM_MARK", "MAIL_FROM", "SMTP_USER_MARK", "SMTP_USER") ||
    requireAny("SMTP_USER_MARK", "SMTP_USER");

  return transporter.sendMail({
    from,
    to,
    subject,
    html,
  });
}
