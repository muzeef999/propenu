/**
 * Bizrow-compatible Meta webhook path:
 *   GET/POST /api/conversation-flow/webhook/:slug
 * Matches callback URL like:
 *   https://api.bizrow.app/api/conversation-flow/webhook/tyent
 */
import { Router } from "express";
import { receiveWebhook, verifyWebhook } from "../whatsapp/whatsapp.controller";
import { whatsappConfig } from "../whatsapp/whatsapp.config";

const router = Router();

function assertWebhookSlug(req: any, res: any, next: any) {
  const slug = String(req.params.slug || "").trim().toLowerCase();
  const expected = String(whatsappConfig.webhookSlug || "tyent")
    .trim()
    .toLowerCase();
  if (!slug || (expected && slug !== expected)) {
    return res.status(404).json({
      success: false,
      message: "Unknown WhatsApp webhook slug",
    });
  }
  return next();
}

router.get("/webhook/:slug", assertWebhookSlug, verifyWebhook);
router.post("/webhook/:slug", assertWebhookSlug, receiveWebhook);

export default router;
