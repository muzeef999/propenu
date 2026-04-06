import { Request, Response } from "express";
import { Types } from "mongoose";
import User from "../../../services/user-service/src/models/userModel";
import { renderTemplate } from "../../notifications/templateEngine";
import EmailTemplate from "./template.model";
import { emailQueue } from "../../../services/user-service/src/queues/email.queue";

// ---------------- CREATE ----------------
export const createEmailTemplate = async (req: Request, res: Response) => {
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
  res: Response,
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
  res: Response,
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
  res: Response,
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
export const sendTemplateToUsers = async (req: Request, res: Response) => {
  try {
    // ✅ Fix for uuid (CommonJS + ESM issue)
    const { v4: uuidv4 } = await import("uuid");

    const campaignId = uuidv4();

    const { slug, city, state, roleId } = req.body;

    console.log("🚀 Campaign started:", campaignId);

    // ✅ Validation
    if (!slug) {
      return res.status(400).json({
        success: false,
        message: "Slug is required",
      });
    }

    // ✅ Get template
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

    // ✅ Build filter
    const filter: any = {
      isActive: true,
      email: { $exists: true, $ne: null },
    };

    if (city) filter.city = city;
    if (state) filter.state = state;

    if (roleId && Types.ObjectId.isValid(roleId)) {
      filter.roleId = new Types.ObjectId(roleId);
    }

    // ✅ BATCH PROCESSING (NO LIMIT ❌ → SAFE LOOP ✅)
    const batchSize = 500;
    let page = 0;
    let totalUsers = 0;

    while (true) {
      const users = await User.find(filter)
        .select("name email city state")
        .skip(page * batchSize)
        .limit(batchSize)
        .lean();

      if (!users.length) break;

      console.log(`📦 Processing batch ${page + 1} (${users.length} users)`);

      // ✅ Parallel queue add (FAST ⚡)
      await Promise.all(
        users.map((user) => {
          if (!user.email) return;

          const data = {
            name: user.name || "User",
            city: user.city || "",
            state: user.state || "",
          };

          const subject = renderTemplate(template.subject, data);
          const html = renderTemplate(template.content, data);

          return emailQueue.add(
            "send-email",
            {
              campaignId,
              email: user.email,
              subject,
              html,
            },
            {
              attempts: 3,
              backoff: {
                type: "exponential",
                delay: 5000,
              },
            }
          );
        })
      );

      totalUsers += users.length;
      page++;
    }

    console.log("✅ Campaign queued:", totalUsers, "users");

    // ✅ Final response
    return res.json({
      success: true,
      campaignId,
      totalUsers,
      message: "Emails queued successfully",
    });
  } catch (error: any) {
    console.error("❌ Campaign error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const sendEmailCampaignStatus = async (
  req: Request,
  res: Response
) => {
  try {
    const { campaignId } = req.query;

    const jobs = await emailQueue.getJobs([
      "waiting",
      "active",
      "completed",
      "failed",
    ]);

    // 🟢 CASE 1: Specific campaign
    if (campaignId) {
      let waiting = 0;
      let active = 0;
      let completed = 0;
      let failed = 0;

      for (const job of jobs) {
        if (job.data.campaignId !== campaignId) continue;

        if (job.failedReason) failed++;
        else if (job.finishedOn) completed++;
        else if (job.processedOn) active++;
        else waiting++;
      }

      const total = waiting + active + completed + failed;

      const progress =
        total === 0 ? 0 : Number(((completed / total) * 100).toFixed(2));

      return res.json({
        success: true,
        data: {
          campaignId,
          total,
          waiting,
          processing: active,
          completed,
          failed,
          progress: `${progress}%`,
          lastUpdated: new Date().toISOString(),
        },
      });
    }

    // 🔵 CASE 2: ALL campaigns summary
    const campaignMap: any = {};

    for (const job of jobs) {
      const id = job.data.campaignId;
      if (!id) continue;

      if (!campaignMap[id]) {
        campaignMap[id] = {
          campaignId: id,
          waiting: 0,
          active: 0,
          completed: 0,
          failed: 0,
        };
      }

      if (job.failedReason) campaignMap[id].failed++;
      else if (job.finishedOn) campaignMap[id].completed++;
      else if (job.processedOn) campaignMap[id].active++;
      else campaignMap[id].waiting++;
    }

    const result = Object.values(campaignMap).map((c: any) => {
      const total =
        c.waiting + c.active + c.completed + c.failed;

      const progress =
        total === 0
          ? 0
          : Number(((c.completed / total) * 100).toFixed(2));

      return {
        ...c,
        total,
        processing: c.active,
        progress: `${progress}%`,
      };
    });

    return res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error("❌ Status error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch campaign status",
    });
  }
};
