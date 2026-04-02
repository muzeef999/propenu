import { Request, Response } from "express";
import { Types } from "mongoose";
import User from "../../../services/user-service/src/models/userModel";
import { renderTemplate } from "../../notifications/templateEngine";
import { sendEmail } from "../email.service";
import EmailTemplate from "./template.model";

// ---------------- CREATE ----------------
export const createEmailTemplate = async (
  req: Request,
  res: Response
) => {
  try {
    const template = await EmailTemplate.create(req.body);

    res.status(201).json({
      success: true,
      data: template,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ---------------- GET ALL ----------------
export const getAllTemplates = async (req: Request, res: Response) => {
  try {
    const templates = await EmailTemplate.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      data: templates,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// ---------------- GET ONE ----------------
export const getTemplateById = async (
  req: Request<{ id: string }>,
  res: Response
) => {
  const { id } = req.params;

  if (!Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid template ID",
    });
  }

  const template = await EmailTemplate.findById(id);

  if (!template) {
    return res.status(404).json({
      success: false,
      message: "Template not found",
    });
  }

  res.json({ success: true, data: template });
};

// ---------------- UPDATE ----------------
export const updateTemplate = async (
  req: Request<{ id: string }>,
  res: Response
) => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid ID" });
    }

    const template = await EmailTemplate.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!template) {
      return res.status(404).json({ message: "Template not found" });
    }

    res.json({ success: true, data: template });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// ---------------- DELETE ----------------
export const deleteTemplate = async (
  req: Request<{ id: string }>,
  res: Response
) => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid ID" });
    }

    await EmailTemplate.findByIdAndDelete(id);

    res.json({
      success: true,
      message: "Deleted successfully",
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// ---------------- SEND EMAIL ----------------
export const sendTemplateToUsers = async (
  req: Request,
  res: Response
) => {
  try {
    console.log("🔥 SEND TEMPLATE API HIT"); // 🔥 DEBUG

    const { slug, city, state, roleId } = req.body;

    if (!slug) {
      return res.status(400).json({
        success: false,
        message: "Slug is required",
      });
    }

    const template = await EmailTemplate.findOne({
      slug,
      status: "active",
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        message: "Template not found",
      });
    }

    const filter: any = {
      isActive: true,
      email: { $exists: true, $ne: null },
    };

    if (city) filter.city = city;
    if (state) filter.state = state;

    if (roleId && Types.ObjectId.isValid(roleId)) {
      filter.roleId = new Types.ObjectId(roleId);
    }

    const users = await User.find(filter)
      .select("name email city state")
      .limit(100)
      .lean();

    if (!users.length) {
      return res.status(404).json({
        success: false,
        message: "No users found",
      });
    }

    await Promise.all(
      users.map(async (user) => {
        if (!user.email) return;

        const data = {
          name: user.name || "User",
          city: user.city || "",
          state: user.state || "",
        };

        const subject = renderTemplate(template.subject, data);
        const html = renderTemplate(template.content, data);

        await sendEmail({
          to: user.email,
          subject,
          html,
        });
      })
    );

    res.json({
      success: true,
      totalUsers: users.length,
      message: "Emails sent successfully",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};