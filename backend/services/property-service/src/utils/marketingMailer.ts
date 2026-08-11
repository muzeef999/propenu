import nodemailer from "nodemailer";

type MarketingSendEmailParams = {
  to: string;
  subject: string;
  html: string;
};

const requireEnv = (name: string) => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ENV variable: ${name}`);
  }
  return value;
};

const createMarketingTransporter = () => {
  const host = requireEnv("SMTP_HOST_MARK");
  const port = Number(requireEnv("SMTP_PORT_MARK"));
  const user = requireEnv("SMTP_USER_MARK");
  const pass = requireEnv("SMTP_PASS_MARK");

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

  return transporter.sendMail({
    from: process.env.MAIL_FROM_MARK || requireEnv("SMTP_USER_MARK"),
    to,
    subject,
    html,
  });
}
