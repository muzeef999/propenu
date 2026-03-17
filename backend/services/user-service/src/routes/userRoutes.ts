import express from "express";
import { saveFcmToken, sendCustomNotification } from "../controller/userController";

const router = express.Router();

router.post("/save-fcm-token", saveFcmToken);

router.post("/admin/notify/custom", sendCustomNotification);


export default router;