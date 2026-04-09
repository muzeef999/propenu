import express from "express";
import {
  saveFcmToken,
  sendCustomNotification,
} from "../controller/userController";
import { upload } from "../middlewares/upload";

const router = express.Router();

router.post("/save-fcm-token", saveFcmToken);
router.post(
  "/admin/notify/custom",
  upload.single("image"),
  sendCustomNotification,
);



export default router;
