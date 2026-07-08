import express from "express";
import {
  getAgentPerformance,
  getDashboardOverview,
  getTicketTrends,
} from "./dashboard.controller";

const router = express.Router();

router.get("/overview", getDashboardOverview);
router.get("/trends", getTicketTrends);
router.get("/agents", getAgentPerformance);

export default router;

