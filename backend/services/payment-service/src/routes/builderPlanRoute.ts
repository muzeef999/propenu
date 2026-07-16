import { Router } from "express";
import {
  createBuilderPlan,
  deleteBuilderPlan,
  getBuilderPlanById,
  getBuilderPlans,
  updateBuilderPlan,
} from "../controller/builderPlan";

const router = Router();

router.get("/", getBuilderPlans);
router.get("/:id", getBuilderPlanById);
router.post("/", createBuilderPlan);
router.patch("/:id", updateBuilderPlan);
router.delete("/:id", deleteBuilderPlan);

export default router;
