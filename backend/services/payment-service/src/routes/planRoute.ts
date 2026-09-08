import { Router } from "express";
import { assignPlan, createPlan, getPlans, updatePlan } from "../controller/plan";
import { authMiddleware } from "../middlewares/authMiddleware";
import { requirePermission } from "../middlewares/requirePermission";

const router = Router();

// Catalogue stays readable for apps; admin UI still gates with plan:view.
router.get("/", getPlans);
router.post("/", authMiddleware, requirePermission("plan:create"), createPlan);
router.patch("/assign", authMiddleware, requirePermission("plan:assign"), assignPlan);
router.patch("/:code", authMiddleware, requirePermission("plan:update"), updatePlan);

export default router;
