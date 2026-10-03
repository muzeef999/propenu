import { Request, Response } from "express";
import mongoose from "mongoose";
import HomeLoanApplication from "../models/homeLoanApplicationModel";
import { verifyToken } from "../utils/jwt";

const RECENT_APPLICATION_WINDOW_HOURS = 24;

const cleanString = (value: unknown, max: number) =>
  typeof value === "string" && value.trim() ? value.trim().slice(0, max) : "";

const cleanObject = (
  value: unknown,
  maxBytes = 12_000,
): Record<string, unknown> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const serialized = JSON.stringify(value);
  if (Buffer.byteLength(serialized, "utf8") > maxBytes) return {};
  return JSON.parse(serialized) as Record<string, unknown>;
};

const getOptionalUserId = (req: Request) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.split(" ")[1];
  if (!token) return null;

  try {
    const decoded = verifyToken(token);
    return decoded.sub && mongoose.Types.ObjectId.isValid(decoded.sub)
      ? new mongoose.Types.ObjectId(decoded.sub)
      : null;
  } catch {
    return null;
  }
};

export const createHomeLoanApplicationController = async (
  req: Request,
  res: Response,
) => {
  try {
    const fullName = cleanString(req.body?.fullName, 120);
    const mobileNumber = cleanString(req.body?.mobileNumber, 24).replace(/\D/g, "");
    const email = cleanString(req.body?.email, 160).toLowerCase();
    const pageUrl = cleanString(req.body?.pageUrl, 2048);
    const source = cleanString(req.body?.source, 80) || "home_loans";
    const metadata = cleanObject(req.body?.metadata);
    const errors: string[] = [];

    if (!fullName) {
      errors.push("Full name is required");
    } else if (!/^[A-Za-z]+(?: [A-Za-z]+)*$/.test(fullName)) {
      errors.push("Full name can contain letters and spaces only");
    } else if (fullName.length < 3) {
      errors.push("Full name must be at least 3 letters");
    }

    if (!mobileNumber) {
      errors.push("Mobile number is required");
    } else if (!/^[6-9]\d{9}$/.test(mobileNumber)) {
      errors.push("Enter a valid 10-digit mobile number");
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push("Enter a valid email address");
    }

    if (req.body?.metadata && Object.keys(metadata).length === 0) {
      errors.push("Metadata must be an object smaller than 12KB");
    }

    if (errors.length) {
      return res.status(400).json({
        success: false,
        message: "Invalid home loan application",
        errors,
      });
    }

    const recentCutoff = new Date(
      Date.now() - RECENT_APPLICATION_WINDOW_HOURS * 60 * 60 * 1000,
    );
    const recentApplication = await HomeLoanApplication.findOne({
      mobileNumber,
      createdAt: { $gte: recentCutoff },
    })
      .select("_id createdAt status")
      .lean();

    if (recentApplication) {
      return res.status(409).json({
        success: false,
        code: "RECENT_HOME_LOAN_APPLICATION_EXISTS",
        message:
          "You have already submitted a home loan application recently. Our team will contact you soon.",
        data: {
          existingApplicationId: String(recentApplication._id),
          submittedAt: recentApplication.createdAt,
          status: recentApplication.status,
          retryAfterHours: RECENT_APPLICATION_WINDOW_HOURS,
        },
      });
    }

    const application = await HomeLoanApplication.create({
      userId: getOptionalUserId(req),
      fullName,
      mobileNumber,
      ...(email ? { email } : {}),
      source,
      ...(pageUrl ? { pageUrl } : {}),
      status: "new",
      metadata,
    });

    return res.status(201).json({
      success: true,
      message: "Home loan application submitted successfully",
      data: {
        id: String(application._id),
        status: application.status,
        createdAt: application.createdAt,
      },
    });
  } catch (error) {
    console.error("createHomeLoanApplication failed:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to submit home loan application",
    });
  }
};
