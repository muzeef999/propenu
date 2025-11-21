import { Router } from "express";
import { subscribe } from "../controller/subscribeController";

const router = Router();
router.post("/subscribe", subscribe);
export default router;
