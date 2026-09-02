// src/routes/whatsapp.routes.ts

import { Router } from "express";
import { receiveWebhook, verifyWebhook } from "./whatsapp.controller";

const router = Router();

router.get("/webhook", verifyWebhook);
router.post("/webhook", receiveWebhook);

export default router;
