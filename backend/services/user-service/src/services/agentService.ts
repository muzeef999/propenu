import Agent from "../models/agentModel";
import mongoose from "mongoose";
import { CreateAgentDTO, UpdateAgentDTO } from "../zod/validation";

class NotFoundError extends Error { status = 404; }
class ConflictError extends Error { status = 409; }

export const AgentService = {
  async createAgent(payload: CreateAgentDTO) {
  
    // business rule: only one agent per user
    const exists = await Agent.findOne({ user: payload.user });
    if (exists) throw new ConflictError("Agent already exists for this user");

    // business convenience: auto slug
    if (!payload.slug) {
      const base = payload.name.toLowerCase().replace(/\s+/g, "-").slice(0, 50);
      payload = { ...payload, slug: `${base}-${Date.now()}` } as CreateAgentDTO;
    }

    // business validation beyond Zod (example)
    if (payload.licenseValidTill && payload.licenseValidTill < new Date()) {
      throw new Error("License already expired");
    }

    const agent = await Agent.create(payload);
    return agent;
  },

  async listAgents({ page = 1, limit = 20, search }: { page?: number; limit?: number; search?: string }) {
    const skip = (page - 1) * limit;
    const filter: any = {};
    if (search) {
      const q = new RegExp(search, "i");
      filter.$or = [{ name: q }, { agencyName: q }, { bio: q }];
    }

    const [items, total] = await Promise.all([
      Agent.find(filter).populate("user", "name email").skip(skip).limit(limit),
      Agent.countDocuments(filter),
    ]);

    return { items, meta: { page, limit, total } };
  },

  async getAgentById(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new NotFoundError("Invalid id");
    const agent = await Agent.findById(id).populate("user", "name email");
    if (!agent) throw new NotFoundError("Agent not found");
    return agent;
  },

  async editAgent(id: string, payload: UpdateAgentDTO) {
    // if updating user field ensure uniqueness
    if (payload.user) {
      const conflict = await Agent.findOne({ user: payload.user, _id: { $ne: id } });
      if (conflict) throw new ConflictError("Another agent exists for this user");
    }

    const updated = await Agent.findByIdAndUpdate(id, payload as any, { new: true }).populate("user", "name email");
    if (!updated) throw new NotFoundError("Agent not found");
    return updated;
  },

  async deleteAgent(id: string) {
    const deleted = await Agent.findByIdAndDelete(id);
    if (!deleted) throw new NotFoundError("Agent not found");
    return;
  },
};
