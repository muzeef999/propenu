import express from "express";
import multer from "multer";
import { validateBody } from "../middlewares/validate";
import { createAgentSchema, updateAgentSchema } from "../zod/validation";
import {
  createAgent,
  deleteAgent,
  editAgent,
  editAgentByPhone,
  getAgentsByCity,
  getAllAgents,
  getIndetailAgent,
  getIndetailSlug,
  getMyAgentProfile,
  getMyPropertyStats,
  verifyAgentStatus,
} from "../controller/agentController";
import { authMiddleware } from "../middlewares/authMiddleware";

const agentRoute = express.Router();

const upload = multer({ storage: multer.memoryStorage() });


agentRoute.post("/", upload.fields([{ name: "avatar", maxCount: 1 }, { name: "coverImage", maxCount: 1 },]),  validateBody(createAgentSchema), createAgent,);
agentRoute.get("/", getAllAgents);
agentRoute.get("/city", getAgentsByCity);
agentRoute.get("/my", authMiddleware, getMyPropertyStats);
agentRoute.get("/:id", getIndetailAgent);
agentRoute.get("/slug/:slug", getIndetailSlug);
agentRoute.get("/me/profile", authMiddleware, getMyAgentProfile);
agentRoute.patch("/:id", upload.fields([{ name: "avatar", maxCount: 1 },{ name: "coverImage", maxCount: 1 }, ]), validateBody(updateAgentSchema), editAgent,);
agentRoute.patch("/by-phone/:phone", upload.fields([ { name: "avatar", maxCount: 1 }, { name: "coverImage", maxCount: 1 }, ]), validateBody(updateAgentSchema), editAgentByPhone,);
agentRoute.delete("/:id", deleteAgent);


agentRoute.patch("/admin/verify/:id", authMiddleware, verifyAgentStatus);


export default agentRoute;
