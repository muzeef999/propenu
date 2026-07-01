import { Router } from "express";
import {
  getBuilderProfile,
  getBuilderProfileById,
  requestBuilderPhoneChangeOtp,
  updateBuilderProfile,
  updateBuilderProfileById,
  verifyBuilderPhoneChangeOtp,
} from "../controller/builderProfileController";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();

router.get("/profile", authMiddleware, getBuilderProfile);
router.patch("/profile", authMiddleware, updateBuilderProfile);
router.post("/profile/phone/request-otp", authMiddleware, requestBuilderPhoneChangeOtp);
router.post("/profile/phone/verify-otp", authMiddleware, verifyBuilderPhoneChangeOtp);
router.get("/profile/:builderId", authMiddleware, getBuilderProfileById);
router.patch("/profile/:builderId", authMiddleware, updateBuilderProfileById);

export default router;
