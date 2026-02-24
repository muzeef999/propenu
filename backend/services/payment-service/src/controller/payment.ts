import { Request, Response } from "express";
import {
  createPaymentOrder,
  verifyPaymentAndActivate,
} from "../services/payment";
import { AuthRequest } from "../middlewares/authMiddleware";

/* ---------------- CREATE PAYMENT ---------------- */

export async function createPayment(req: AuthRequest, res: Response) {
  try {
    const { planId } = req.body;

    if (!planId) {
      return res.status(400).json({ message: "planId is required" });
    }

const role = req.user!.roleName;

const userType =
  role === "user"
    ? "buyer"
    : role === "builder"
      ? "owner"
      : role === "agent"
        ? "agent"
        : "buyer";
    const userId = req.user!.id;

    const result = await createPaymentOrder(planId, userId, userType);

    if ("free" in result) {
  return res.json({
    success: true,
    free: true,
    message: "Free plan activated 🎉",
  });
}

    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
}

/* ---------------- VERIFY PAYMENT ---------------- */

export async function verifyPayment(req: AuthRequest, res: Response) {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      planId,
    } = req.body;

    await verifyPaymentAndActivate(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    );

    res.json({ message: "Payment verified & subscription activated" });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
}
