import { Router } from "express";
import { assignPlan, createPlan, getPlans, updatePlan } from "../controller/plan";

const router = Router();

// READ
router.get("/", getPlans);

//ADMIN /DEV
router.post("/", createPlan);
router.patch("/:code", updatePlan);


// USER SUBSCRIPTION
router.patch("/assign", assignPlan);


export default router;


