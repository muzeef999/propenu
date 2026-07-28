import { Request, Response } from "express";
import { getAccountsSummary, getPayments, getRevenueByPlan, getSubscriptionHistoryone, getSubscriptions } from "../services/accountServices";

export const getAccountsSummaryController = async (
  req: Request,
  res: Response
) => {
  const data = await getAccountsSummary(req.query as Record<string, any>);
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
  req: Request,
  res: Response
) => {
  const data = await getRevenueByPlan(req.query as Record<string, any>);
  res.json(data);
};
