// src/whatsapp/whatsapp.controller.ts

import { Request, Response } from "express";
import { whatsappConfig } from "./whatsapp.config";
import { processWhatsAppWebhookPayload } from "../../../../shared/whatsapp/inbox/whatsappInbox.service";

export const verifyWebhook = (req: Request, res: Response) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  console.log("Verification Request", req.query);

  if (mode === "subscribe" && token === whatsappConfig.verifyToken) {
    console.log("Webhook Verified Successfully");
    return res.status(200).send(challenge);
  }

  console.log("Webhook Verification Failed");
  return res.sendStatus(403);
};

export const receiveWebhook = async (req: Request, res: Response) => {
  console.log("📩 Incoming WhatsApp Webhook");

  try {
    const result = await processWhatsAppWebhookPayload(req.body);
    if (result.saved > 0) {
      console.log(`WhatsApp inbox saved ${result.saved} message(s)`);
    }
    return res.sendStatus(200);
  } catch (error) {
    console.error("WhatsApp webhook error:", error);
    // Always 200 to Meta so they do not retry aggressively on our bugs
    return res.sendStatus(200);
  }
};
