import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware";
import { createRole, getAllRoles, getRoleById, updateRolePermissions, updateRoleStatus } from "../controller/roleController";
import { adminOnly } from "../middlewares/adminOnly";


const roleRoute = express.Router();


roleRoute.post("/", authMiddleware, adminOnly, createRole);
roleRoute.get("/", authMiddleware, adminOnly, getAllRoles);
roleRoute.get("/:id", authMiddleware, adminOnly, getRoleById);
roleRoute.patch("/:id/permissions",
  authMiddleware,
  adminOnly,
  updateRolePermissions
);
roleRoute.patch("/:id/status",
  authMiddleware,
  adminOnly,
  updateRoleStatus
);




export default roleRoute
