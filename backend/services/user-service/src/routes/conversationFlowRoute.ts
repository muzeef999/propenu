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
  const primary = String(whatsappConfig.webhookSlug || "tyent")
    .trim()
    .toLowerCase();
  // Accept env slug + common aliases (Meta may still use /propenu from Bizrow era)
  const allowed = new Set(
    [primary, "tyent", "propenu"]
      .concat(
        String(process.env.WHATSAPP_WEBHOOK_SLUG_ALIASES || "")
          .split(",")
          .map((s) => s.trim().toLowerCase())
          .filter(Boolean),
      )
      .filter(Boolean),
  );
  if (!slug || !allowed.has(slug)) {
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
