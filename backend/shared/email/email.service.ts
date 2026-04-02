import nodemailer from "nodemailer";

type SendEmailParams = {
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


export function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<any>;

export function sendEmail(params: SendEmailParams): Promise<any>;

// 🔥 actual implementation
export async function sendEmail(
  arg1: string | SendEmailParams,
  arg2?: string,
  arg3?: string
) {
  const transporter = createTransporter();
  await transporter.verify();

  let to: string;
  let subject: string;
  let html: string;

  // ✅ detect usage style
  if (typeof arg1 === "object") {
    to = arg1.to;
    subject = arg1.subject;
    html = arg1.html;
  } else {
    to = arg1;
    subject = arg2!;
    html = arg3!;
  }

  const info = await transporter.sendMail({
    from: process.env.MAIL_FROM || requireEnv("SMTP_USER"),
    to,
    subject,
    html,
  });

  return info;
}