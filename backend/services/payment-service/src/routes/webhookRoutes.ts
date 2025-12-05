import { Router } from "express";
import { razorpayWebhook } from "../controller/webhookController";

const router = Router();
router.post("/", razorpayWebhook);
export default router;
