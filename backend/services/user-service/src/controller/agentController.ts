import { Request, Response } from "express";
import { CreateAgentDTO, UpdateAgentDTO } from "../zod/validation";
import AgentService from "../services/agentService";
import { GetAgentsQuery } from "../types";

type MulterFiles = {
  avatar?: Express.Multer.File[];
  coverImage?: Express.Multer.File[];
} | undefined;

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
