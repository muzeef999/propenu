import { Request, Response } from "express";
import { CreateAgentDTO, UpdateAgentDTO } from "../zod/validation";
import AgentService from "../services/agentService";
import { GetAgentsQuery } from "../types";
import Agent from "../models/agentModel";
import { AuthRequest } from "../middlewares/authMiddleware";
import Residential from "../models/residentialModel";
import Commercial from "../models/commercialModel";
import LandPlot from "../models/landModel";
import Agricultural from "../models/agriculturalModel";

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

export const getIndetailAgent = async (req: Request, res: Response) => {
  const id = req.params.id;
  if (!id) return res.status(400).json({ message: "Agent id is required" });

  const agent = await AgentService.getAgentById(id);
  return res.status(200).json({ agent });
};

export const getIndetailSlug = async (req: Request, res: Response) => {
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

export const deleteAgent = async (req: Request, res: Response) => {
  const id = req.params.id;

  if (!id) return res.status(400).json({ message: "Agent id is required" });

  await AgentService.deleteAgent(id);
  return res.status(200).json({ message: "Agent deleted" });
};

export const getMyPropertyStats = async (req: AuthRequest, res: Response) => {
  
  const userId = req.user!.sub;
  
  const agent = await Agent.findOne({ user: userId }).lean();

  if (!agent) {
    return res.json({
      exists: false,
      message: "Agent profile not created",
    });
  }

  const [
    residentialActive,
    residentialPending,
    commercialActive,
    commercialPending,
    landActive,
    landPending,
    agriculturalActive,
    agriculturalPending,
  ] = await Promise.all([
    Residential.countDocuments({ createdBy: userId, status: "active" }),
    Residential.countDocuments({ createdBy: userId, status: "inactive" }),

    Commercial.countDocuments({ createdBy: userId, status: "active" }),
    Commercial.countDocuments({ createdBy: userId, status: "inactive" }),

    LandPlot.countDocuments({ createdBy: userId, status: "active" }),
    LandPlot.countDocuments({ createdBy: userId, status: "inactive" }),

    Agricultural.countDocuments({ createdBy: userId, status: "active" }),
    Agricultural.countDocuments({ createdBy: userId, status: "inactive" }),
  ]);

  res.json({
    active: {
      residential: residentialActive,
      commercial: commercialActive,
      land: landActive,
      agricultural: agriculturalActive,
      total:
        residentialActive + commercialActive + landActive + agriculturalActive,
    },
    pending: {
      residential: residentialPending,
      commercial: commercialPending,
      land: landPending,
      agricultural: agriculturalPending,
      total:
        residentialPending +
        commercialPending +
        landPending +
        agriculturalPending,
    },
  });
};
