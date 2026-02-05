import { Router } from "express";
import { assignPlan, createPlan, getPlans, updatePlan } from "../controller/plan";

const router = Router();


router.get("/", getPlans);
router.post("/", createPlan);
router.patch("/:code", updatePlan);
router.patch("/assign", assignPlan);


export default router;


