import { Request, Response } from "express";
import { PaymentService } from "../services/paymentService";

export async function createOrder(req: Request, res: Response) {
  try {
    const { userId, role, planId, amount } = req.body;

    if (!userId || !role || !planId || !amount) {
      return res.status(400).json({
        message: "Missing required fields",
      });
    }

    const order = await PaymentService.createOrder({
      userId,
      role,
      planId,
      amount,
    });

    return res.status(201).json(order);
  } catch (error: any) {
    return res.status(500).json({
      message: error.message || "Failed to create order",
    });
  }
}

export async function verifyPayment(req: Request, res: Response) {
  try {
    const { orderId, paymentId, signature } = req.body;

    if (!orderId || !paymentId || !signature) {
      return res.status(400).json({
        message: "Missing payment verification fields",
      });
    }

    const payment = await PaymentService.verifyPayment({
      orderId,
      paymentId,
      signature,
    });

    return res.status(200).json({
      success: true,
      payment,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || "Payment verification failed",
    });
  }
}
