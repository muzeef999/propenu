import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware";
import { createListingPromotionHandlers } from "../controller/listingPromotionController";

/**
 * Central listing promotion routes mounted at /api/properties
 * so PATCH /:category/:id/promote is always registered.
 * Auth-only (same as featured-project promote) — Super Admin / staff JWT required.
 */
const router = express.Router();

const CATEGORIES = [
  "residential",
  "commercial",
  "land",
  "agricultural",
] as const;

for (const category of CATEGORIES) {
  const handlers = createListingPromotionHandlers(category);

  router.patch(`/${category}/:id/promote`, authMiddleware, handlers.promote);
  router.patch(`/${category}/:id/renew`, authMiddleware, handlers.renew);
  router.patch(`/${category}/:id/expire`, authMiddleware, handlers.expire);
  router.patch(`/${category}/:id/reset`, authMiddleware, handlers.reset);
}

export default router;
