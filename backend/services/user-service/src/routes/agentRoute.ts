import express, { Request, Response } from "express";
import { validateBody } from "../middlewares/validate";
import { createAgentSchema, updateAgentSchema } from "../zod/validation";
import { createAgent, deleteAgent, editAgent, getAllAgents, getIndetailAgent } from "../controller/agentController";

const agentRoute = express.Router();

agentRoute.post("/", validateBody(createAgentSchema), createAgent);
agentRoute.get("/",  getAllAgents);
agentRoute.get("/:id", getIndetailAgent);
agentRoute.patch("/:id", validateBody(updateAgentSchema), editAgent);
agentRoute.delete("/:id", deleteAgent);


export default agentRoute;
