import { Router } from "express";
import {
  getAccountsSummaryController,
  getPaymentsController,
  getRevenueByPlanController,
  getSubscriptionHistoryController,
  getSubscriptionsController,
} from "../controller/accountController";
import { authMiddleware } from "../middlewares/authMiddleware";
import { requireAnyPermission, requirePermission } from "../middlewares/requirePermission";

const accountRoutes = Router();

accountRoutes.get(
  "/summary",
  authMiddleware,
  requirePermission("payment:view"),
  getAccountsSummaryController,
);
accountRoutes.get(
  "/payments",
  authMiddleware,
  requirePermission("payment:view"),
  getPaymentsController,
);
accountRoutes.get(
  "/subscriptions",
  authMiddleware,
  requirePermission("subscription:view"),
  getSubscriptionsController,
);
accountRoutes.get(
  "/subscription-history",
  authMiddleware,
  requirePermission("subscription:view_history"),
  getSubscriptionHistoryController,
);
accountRoutes.get(
  "/revenue/by-plan",
  authMiddleware,
  requireAnyPermission(["payment:view_reports", "payment:view"]),
  getRevenueByPlanController,
);

export default accountRoutes;
