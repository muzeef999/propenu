import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware";
import {
  callbackKyc,
  startKyc,
  updateKycDetails,
} from "../controller/kycController";
const router = express.Router();

router.get("/start", authMiddleware, startKyc);
router.patch("/details", authMiddleware, updateKycDetails);
router.get("/callback", callbackKyc);

export default router;
