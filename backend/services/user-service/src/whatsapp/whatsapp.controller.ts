// src/controllers/whatsapp.controller.ts

import { Request, Response } from "express";
import { whatsappConfig } from "./whatsapp.config";

export const verifyWebhook = (
  req: Request,
  res: Response
) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  console.log("Verification Request");
  console.log(req.query);

  if (
    mode === "subscribe" &&
    token === whatsappConfig.verifyToken
  ) {
    console.log("Webhook Verified Successfully");

    return res.status(200).send(challenge);
  }

  console.log("Webhook Verification Failed");

  return res.sendStatus(403);
};

export const receiveWebhook = (
  req: Request,
  res: Response
) => {
  console.log("=================================");
  console.log("📩 Incoming WhatsApp Webhook");
  console.log("=================================");

  console.log(
    JSON.stringify(req.body, null, 2)
  );

  try {
    const message =
      req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

    if (!message) {
      return res.sendStatus(200);
    }

    const phone = message.from;

    const text =
      message.text?.body || "";

    console.log("Phone :", phone);
    console.log("Message :", text);

    return res.sendStatus(200);
  } catch (error) {
    console.error(error);

    return res.sendStatus(500);
  }
};