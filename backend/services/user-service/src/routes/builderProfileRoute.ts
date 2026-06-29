import { Router } from "express";
import {
  getBuilderProfile,
  getBuilderProfileById,
  updateBuilderProfile,
  updateBuilderProfileById,
} from "../controller/builderProfileController";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();

router.get("/profile", authMiddleware, getBuilderProfile);
router.patch("/profile", authMiddleware, updateBuilderProfile);
router.get("/profile/:builderId", authMiddleware, getBuilderProfileById);
router.patch("/profile/:builderId", authMiddleware, updateBuilderProfileById);

export default router;
