import express from "express";
import { getSponsored } from "./sponsored.controller";

const router = express.Router();

// 🔥 Sponsored API
router.get("/", getSponsored);

export default router;