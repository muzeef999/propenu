import { Request, Response } from "express";
import { getAccountsSummary, getPayments, getRevenueByPlan, getSubscriptionHistoryone, getSubscriptions } from "../services/accountServices";
import { getSubscriptionHistory } from "./subscriptionController";

export const getAccountsSummaryController = async (
  _req: Request,
  res: Response
) => {
  const data = await getAccountsSummary();
  res.json(data);
};

export const getPaymentsController = async (
  req: Request,
  res: Response
) => {
  const data = await getPayments(req.query);
  res.json(data);
};

export const getSubscriptionsController = async (
  req: Request,
  res: Response
) => {
  const data = await getSubscriptions(req.query);
  res.json(data);
};

export const getSubscriptionHistoryController = async (
  req: Request,
  res: Response
) => {
  const data = await getSubscriptionHistoryone(req.query);
  res.json(data);
};

export const getRevenueByPlanController = async (
  _req: Request,
  res: Response
) => {
  const data = await getRevenueByPlan();
  res.json(data);
};
