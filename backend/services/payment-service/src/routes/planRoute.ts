import { Router } from "express";
import { getPlans } from "../controller/plan";

const router = Router();

router.get("/", getPlans);

export default router;
