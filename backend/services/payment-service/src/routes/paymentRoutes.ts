import { Router } from "express";
import { createPayment, verifyPayment } from "../controller/payment";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();

router.post("/create", authMiddleware, createPayment);
router.post("/verify", authMiddleware, verifyPayment);

export default router;
