import { Request, Response } from "express";
import {
  createPaymentOrder,
  verifyPaymentAndActivate,
} from "../services/payment";
import { AuthRequest } from "../middlewares/authMiddleware";
import { sendSubscriptionActivatedEmail } from "../../../../shared/email/email.helper";

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
    } = req.body;

    const result = await verifyPaymentAndActivate(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    );

    let emailSent = false;

    if (!result.alreadyPaid && result.subscriptionName && req.user?.email) {
      try {
        await sendSubscriptionActivatedEmail(
          req.user.email,
          req.user.name?.trim() || "Customer",
          result.subscriptionName,
          {
            roleName: req.user.roleName,
            invoiceLink: result.invoiceUrl,
          },
        );

        emailSent = true;
      } catch (emailError: any) {
        console.error("[payment] failed to send subscription activation email", {
          email: req.user.email,
          subscriptionName: result.subscriptionName,
          error: emailError?.message,
          response: emailError?.response,
        });
      }
    }

    res.json({
      message: result.message || "Payment verified & subscription activated",
      emailSent,
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
}
