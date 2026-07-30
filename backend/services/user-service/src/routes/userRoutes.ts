import express from "express";
import {
  getAdminNotifications,
  markAdminNotificationsSeen,
  saveFcmToken,
  sendCustomNotification,
} from "../controller/userController";
import { uploadNotificationImage } from "../middlewares/upload";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = express.Router();

router.post("/save-fcm-token", saveFcmToken);
router.get("/admin/feed", authMiddleware, getAdminNotifications);
router.post("/admin/feed/seen", authMiddleware, markAdminNotificationsSeen);
router.post(
  "/admin/notify/custom",
  authMiddleware,
  uploadNotificationImage.single("image"),
  sendCustomNotification,
);



export default router;
