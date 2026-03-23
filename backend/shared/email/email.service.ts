import nodemailer from "nodemailer";

const requireEnv = (name: string) => {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing ENV variable: ${name}`);
  }

  return value;
};

const createTransporter = () => {
  const host = requireEnv("SMTP_HOST");
  const port = Number(requireEnv("SMTP_PORT"));
  const user = requireEnv("SMTP_USER");
  const pass = requireEnv("SMTP_PASS");

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


export const sendEmail = async (
  to: string,
  subject: string,
  html: string
) => {
  const transporter = createTransporter();
  await transporter.verify();

  const info = await transporter.sendMail({
    from: process.env.MAIL_FROM || requireEnv("SMTP_USER"),
    to,
    subject,
    html,
  });

  return info;

};
