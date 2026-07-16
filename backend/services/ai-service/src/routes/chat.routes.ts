import { Router } from "express";
import { chatController, suggestionsController } from "../controllers/chat.controller";

const router = Router();

router.get("/suggestions", suggestionsController);

router.post("/", chatController);

export default router;
