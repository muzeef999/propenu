import { Router } from "express";
import {
  createBuilderPlan,
  deleteBuilderPlan,
  getBuilderPlanById,
  getBuilderPlans,
  updateBuilderPlan,
} from "../controller/builderPlan";
import { adminOnly } from "../middlewares/adminOnly";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();

router.get("/", getBuilderPlans);
router.get("/:id", getBuilderPlanById);
router.post("/", authMiddleware, adminOnly, createBuilderPlan);
router.patch("/:id", authMiddleware, adminOnly, updateBuilderPlan);
router.delete("/:id", authMiddleware, adminOnly, deleteBuilderPlan);

export default router;
