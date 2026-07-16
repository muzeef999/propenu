// src/config/whatsapp.config.ts

export const whatsappConfig = {
  token: process.env.WHATSAPP_TOKEN || "",
  phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || "",
  verifyToken: process.env.WHATSAPP_VERIFY_TOKEN || "",
  apiVersion: "v23.0",
};