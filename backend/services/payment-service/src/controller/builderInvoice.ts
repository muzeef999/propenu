import { Request, Response } from "express";
import { Types } from "mongoose";
import { BuilderInvoice } from "../models/builderInvoiceModel";
import User from "../../../user-service/src/models/userModel";
import { AuthRequest } from "../middlewares/authMiddleware";

function getRoleNameFromUser(user: any) {
  const role = user?.roleId;

  if (!role) return undefined;
  if (typeof role === "string") return undefined;
  if (typeof role?.name === "string") return role.name.toLowerCase();

  return undefined;
}

function buildBuilderDetails(user: any) {
  return {
    name: user?.name,
    companyName: user?.companyName,
    email: user?.email,
    phone: user?.phone,
    userCode: user?.userCode,
    locality: user?.locality,
    city: user?.city,
    state: user?.state,
    pincode: user?.pincode,
    address: user?.address,
  };
}

export async function getBuilderInvoices(req: Request, res: Response) {
  try {
    const { userId, propertyId, servicePlanId, paymentStatus, invoiceNumber } =
      req.query;

    const filter: Record<string, unknown> = {};

    if (userId) filter.userId = userId;
    if (propertyId) filter.propertyId = propertyId;
    if (servicePlanId) filter.servicePlanId = servicePlanId;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (invoiceNumber) filter.invoiceNumber = invoiceNumber;

    const invoices = await BuilderInvoice.find(filter)
      .populate("userId")
      .populate("propertyId")
      .populate("servicePlanId")
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      invoices,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch builder invoices",
    });
  }
}

export async function getBuilderInvoiceById(req: Request, res: Response) {
  try {
    const id = req.params.id;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Builder invoice id is required",
      });
    }

    const invoice = Types.ObjectId.isValid(id)
      ? await BuilderInvoice.findById(id)
          .populate("userId")
          .populate("propertyId")
          .populate("servicePlanId")
      : await BuilderInvoice.findOne({ invoiceNumber: id })
          .populate("userId")
          .populate("propertyId")
          .populate("servicePlanId");

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Builder invoice not found",
      });
    }

    return res.json({
      success: true,
      invoice,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch builder invoice",
    });
  }
}

export async function createBuilderInvoice(req: AuthRequest, res: Response) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const targetUserId = req.body.userId;

    if (!targetUserId || !Types.ObjectId.isValid(String(targetUserId))) {
      return res.status(400).json({
        success: false,
        message: "A valid builder userId is required",
      });
    }

    const targetUser = await User.findById(targetUserId).populate("roleId", "name");

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "Selected builder user not found",
      });
    }

    const targetRoleName = getRoleNameFromUser(targetUser);

    if (targetRoleName !== "builder") {
      return res.status(400).json({
        success: false,
        message: "Selected user is not a builder",
      });
    }

    const payload = {
      ...req.body,
      userId: String(targetUser._id),
      builderDetails: buildBuilderDetails(targetUser),
    };

    const invoice = await BuilderInvoice.create(payload);

    return res.status(201).json({
      success: true,
      message: "Builder invoice created successfully",
      invoice,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

export async function updateBuilderInvoice(req: AuthRequest, res: Response) {
  try {
    const id = req.params.id;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Builder invoice id is required",
      });
    }

    const invoice = Types.ObjectId.isValid(id)
      ? await BuilderInvoice.findById(id)
      : await BuilderInvoice.findOne({ invoiceNumber: id });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Builder invoice not found",
      });
    }

    Object.assign(invoice, req.body);
    await invoice.save();

    return res.json({
      success: true,
      message: "Builder invoice updated successfully",
      invoice,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

export async function deleteBuilderInvoice(req: AuthRequest, res: Response) {
  try {
    const id = req.params.id;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Builder invoice id is required",
      });
    }

    const invoice = Types.ObjectId.isValid(id)
      ? await BuilderInvoice.findByIdAndDelete(id)
      : await BuilderInvoice.findOneAndDelete({ invoiceNumber: id });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Builder invoice not found",
      });
    }

    return res.json({
      success: true,
      message: "Builder invoice deleted successfully",
      invoice,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete builder invoice",
    });
  }
}
