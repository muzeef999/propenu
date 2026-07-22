import { Router } from "express";
import { captureInteraction, getUserJourney, getUserSession } from "../controller/userInteractionController";
import { authMiddleware } from "../middlewares/authMiddleware";
import { requirePermission } from "../middlewares/requirePermission";

const router = Router();

router.post("/", authMiddleware, captureInteraction);
router.get("/user-journey/:userId", authMiddleware, requirePermission("user:view", ["super_admin", "admin"]), getUserJourney);
router.get("/user-journey/:userId/sessions/:sessionId", authMiddleware, requirePermission("user:view", ["super_admin", "admin"]), getUserSession);

export default router;
