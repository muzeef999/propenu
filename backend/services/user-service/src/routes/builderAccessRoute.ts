import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware";
import {
  createBuilderMember,
  createBuilderRole,
  getBuilderMembers,
  getBuilderPermissionCatalog,
  getBuilderRoles,
  updateBuilderMember,
  updateBuilderRole,
} from "../controller/builderAccessController";

const router = express.Router();

router.get("/permissions", authMiddleware, getBuilderPermissionCatalog);

router.post("/roles", authMiddleware, createBuilderRole);
router.get("/roles", authMiddleware, getBuilderRoles);
router.patch("/roles/:id", authMiddleware, updateBuilderRole);

router.post("/members", authMiddleware, createBuilderMember);
router.get("/members", authMiddleware, getBuilderMembers);
router.patch("/members/:id", authMiddleware, updateBuilderMember);

export default router;
