import express from "express";
import { saveFcmToken } from "../controller/userController";
import { testPush } from "../controller/userController";


const router = express.Router();

router.post("/save-fcm-token", saveFcmToken);

router.post("/test-push", testPush);

export default router;