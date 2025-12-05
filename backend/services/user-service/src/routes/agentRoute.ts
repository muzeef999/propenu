import express from "express";
import multer from "multer";
import { validateBody } from "../middlewares/validate";
import { createAgentSchema, updateAgentSchema, } from "../zod/validation";
import { createAgent,  deleteAgent,  editAgent,  getAllAgents,  getIndetailAgent} from "../controller/agentController";

const agentRoute = express.Router();

const upload = multer({ storage: multer.memoryStorage() });

agentRoute.post( "/",upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  validateBody(createAgentSchema),
  createAgent
);

agentRoute.get("/", getAllAgents);
agentRoute.get("/:id", getIndetailAgent);

agentRoute.patch(
  "/:id",
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  validateBody(updateAgentSchema),
  editAgent
);

agentRoute.delete("/:id", deleteAgent);

export default agentRoute;
