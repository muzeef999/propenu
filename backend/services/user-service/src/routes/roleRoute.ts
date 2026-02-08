import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware";
import { createRole, getAllRoles, getRoleById, updateRolePermissions } from "../controller/roleController";
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




export default roleRoute