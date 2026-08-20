import { Router } from "express";
import multer from "multer";
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
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
});

const mediaFields = upload.fields([
  { name: "avatar", maxCount: 1 },
  { name: "logo", maxCount: 1 },
  { name: "coverImage", maxCount: 1 },
]);

router.get("/profile", authMiddleware, getBuilderProfile);
router.patch("/profile", authMiddleware, mediaFields, updateBuilderProfile);
router.post("/profile/phone/request-otp", authMiddleware, requestBuilderPhoneChangeOtp);
router.post("/profile/phone/verify-otp", authMiddleware, verifyBuilderPhoneChangeOtp);
router.get("/profile/:builderId", authMiddleware, getBuilderProfileById);
router.patch(
  "/profile/:builderId",
  authMiddleware,
  mediaFields,
  updateBuilderProfileById,
);

export default router;
