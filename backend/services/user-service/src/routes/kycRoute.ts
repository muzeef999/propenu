import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware";
import { callbackKyc, startKyc } from "../controller/kycController";
const router = express.Router();

router.get("/start", authMiddleware, startKyc);
router.get("/callback", callbackKyc);

export default router;