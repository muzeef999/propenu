import { Request, Response } from "express";
import crypto from "crypto";
import * as subscriptionService from "../services/subscriptionService.js";

export async function razorpayWebhook(req: Request, res: Response) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET ?? "";
  const signature = (req.headers["x-razorpay-signature"] as string) ?? "";

  const raw = (req as any).rawBody as Buffer | undefined;
  if (!raw) return res.status(400).send("Missing raw body (use express.raw)");

  const bodyString = raw.toString("utf8");
  const expected = crypto.createHmac("sha256", secret).update(bodyString).digest("hex");

  try {
    // constant-time compare
    const sigBuf = Buffer.from(signature, "hex");
    const expBuf = Buffer.from(expected, "hex");
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      console.warn("Invalid signature");
      return res.status(400).send("Invalid signature");
    }
  } catch (e) {
    console.warn("Signature verify error", e);
    return res.status(400).send("Invalid signature");
  }

  let payload;
  try { payload = JSON.parse(bodyString); } catch (e) {
    return res.status(400).send("Invalid JSON");
  }

  const event = payload.event;
  if (event === "payment.captured") {
    const payment = payload.payload?.payment?.entity;
    if (!payment) return res.status(200).send("No payment entity");

    try {
      await subscriptionService.activateSubscriptionByOrder(payment.order_id, payment);
      return res.status(200).send("OK");
    } catch (err) {
      console.error("Activate subscription error", err);
      return res.status(500).send("Server error");
    }
  }

  // handle other events as needed:
  return res.status(200).send("ignored");
}
