import { Router } from "express";
import { getAccountsSummaryController, getPaymentsController, getRevenueByPlanController, getSubscriptionHistoryController, getSubscriptionsController } from "../controller/accountController";

const accountRoutes = Router();

accountRoutes.get("/summary", getAccountsSummaryController);
accountRoutes.get("/payments", getPaymentsController);
accountRoutes.get("/subscriptions", getSubscriptionsController);
accountRoutes.get("/subscription-history", getSubscriptionHistoryController);
accountRoutes.get("/revenue/by-plan", getRevenueByPlanController);




export default accountRoutes;


