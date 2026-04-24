import express from "express";
import { promoteProperty } from "../controller/promotionController";

const router = express.Router();

router.post("/:id/promote", promoteProperty);

export default router;