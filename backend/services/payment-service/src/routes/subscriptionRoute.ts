import { Router } from "express";
import { authMiddleware } from "../middlewares/authMiddleware";
import { getMySubscription } from "../controller/subscriptionController";

const router = Router();

router.get("/me", authMiddleware, getMySubscription);

export default router;
