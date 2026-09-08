import { Router } from "express";
import {
  createBuilderPlan,
  deleteBuilderPlan,
  getBuilderPlanById,
  getBuilderPlans,
  updateBuilderPlan,
} from "../controller/builderPlan";
import { authMiddleware } from "../middlewares/authMiddleware";
import { requirePermission } from "../middlewares/requirePermission";

const router = Router();

router.get("/", getBuilderPlans);
router.get("/:id", getBuilderPlanById);
router.post("/", authMiddleware, requirePermission("plan:create"), createBuilderPlan);
router.patch("/:id", authMiddleware, requirePermission("plan:update"), updateBuilderPlan);
router.delete("/:id", authMiddleware, requirePermission("plan:delete"), deleteBuilderPlan);

export default router;
