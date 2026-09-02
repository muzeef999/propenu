// src/whatsapp/whatsapp.config.ts

export const whatsappConfig = {
  token: process.env.WHATSAPP_TOKEN || "",
  phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || "",
  businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || "",
  appId: process.env.WHATSAPP_APP_ID || "",
  verifyToken: process.env.WHATSAPP_VERIFY_TOKEN || "",
  apiVersion: process.env.WHATSAPP_API_VERSION || "v23.0",
  /** Public Meta callback URL (must hit this app for live inbound chat) */
  webhookCallbackUrl: process.env.WHATSAPP_WEBHOOK_CALLBACK_URL || "",
  webhookSlug: process.env.WHATSAPP_WEBHOOK_SLUG || "tyent",
  autoReplyEnabled: ["1", "true", "yes"].includes(
    String(process.env.WHATSAPP_AUTO_REPLY_ENABLED || "")
      .toLowerCase()
      .trim(),
  ),
  welcomeMessage:
    process.env.WHATSAPP_WELCOME_MESSAGE ||
    "Hi , welcome to propenu what do you want to do ? Options: User, Builder, view propties",
};
