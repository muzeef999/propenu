import { Request, Response } from "express";
import { CreateAgentDTO, UpdateAgentDTO } from "../zod/validation";
import AgentService from "../services/agentService";
import { GetAgentsQuery } from "../types";
import { AuthRequest } from "../middlewares/authMiddleware";
import Agent from "../models/agentModel";

type MulterFiles =
  | {
      avatar?: Express.Multer.File[];
      coverImage?: Express.Multer.File[];
    }
  | undefined;

export const createAgent = async (req: Request, res: Response) => {
  const payload = req.body as unknown as CreateAgentDTO;
  const files = req.files as MulterFiles;

  const created = await AgentService.createAgent(payload, files);
  return res.status(201).json({ message: "Agent created", agent: created });
};

export const getAllAgents = async (
  req: Request<{}, {}, {}, GetAgentsQuery>,
  res: Response
) => {
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 20);
  const search =
    typeof req.query.search === "string" ? req.query.search : undefined;

  const result = await AgentService.listAgents({ page, limit, search });
  return res.status(200).json(result);
};

export const getAgentsByCity = async (req: Request, res: Response) => {
  try {
    const city =
      typeof req.query.city === "string" ? req.query.city.trim() : "";

    const state =
      typeof req.query.state === "string" ? req.query.state.trim() : "";

    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);

    const result = await AgentService.getAgentsByLocationService(
      { city, state },
      page,
      limit
    );

    res.json(result);
  } catch (err: any) {
    console.error("getAgentsByCity:", err);
    res.status(500).json({ message: "Failed to load agents" });
  }
};

export const getIndetailAgent = async (req: Request, res: Response) => {
  const id = req.params.id;
  if (!id) return res.status(400).json({ message: "Agent id is required" });

  const agent = await AgentService.getAgentById(id);
  return res.status(200).json({ agent });
};

export const getIndetailSlug = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { slug } = req.params;

    if (!slug || typeof slug !== "string") {
      return res.status(400).json({ message: "Invalid slug" });
    }

    const result = await AgentService.getAgentBySlugWithProperties(slug);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error("getIndetailSlug error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch property details",
    });
  }
};

export const editAgent = async (req: Request, res: Response) => {
  const id = req.params.id;
  const payload = req.body as UpdateAgentDTO;
  const files = req.files as MulterFiles;

  if (!id) return res.status(400).json({ message: "Agent id is required" });

  const updated = await AgentService.editAgent(id, payload, files);
  return res.status(200).json({ message: "Agent updated", agent: updated });
};

export const editAgentByPhone = async (req: Request, res: Response) => {
  const { phone } = req.params;
  const payload = req.body as UpdateAgentDTO;
  const files = req.files as MulterFiles;

  if (!phone) {
    return res.status(400).json({ message: "Phone number is required" });
  }

  const updated = await AgentService.editAgentByPhone(phone, payload, files);

  return res.status(200).json({
    message: "Agent updated",
    agent: updated,
  });
};

export const deleteAgent = async (req: Request, res: Response) => {
  const id = req.params.id;

  if (!id) return res.status(400).json({ message: "Agent id is required" });

  await AgentService.deleteAgent(id);
  return res.status(200).json({ message: "Agent deleted" });
};

export const getMyPropertyStats = async (req: AuthRequest, res: Response) => {
  
  const userId = req.user!.sub;
  const range = (req.query.range as string) || "30d";

  const data = await AgentService.getAgentDashboardAnalytics(userId, range);

 if (!data.exists) {
    return res.json({
      exists: false,
      message: "Agent profile not created",
    });
  }

  res.json(data);

};

export const getMyAgentProfile = async (req: AuthRequest, res: Response) => {
  const userId = req.user!.sub;

  const agent = await AgentService.getAgentByUserId(userId);

  if (!agent) {
    return res.status(404).json({
      exists: false,
      message: "Agent profile not created",
    });
  }

  res.status(200).json({
    exists: true,
    agent,
  });
};

export const verifyAgentStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({
        message: "Invalid status",
      });
    }

    const agent = await Agent.findByIdAndUpdate(
      id,
      { verificationStatus: status },
      { new: true }
    );

    if (!agent) {
      return res.status(404).json({
        message: "Agent not found",
      });
    }

    return res.json({
      message: `Agent ${status} successfully`,
      agent,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to update agent status",
    });
  }
};
