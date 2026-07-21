import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware";
import { createRole, deleteRole, getAllRoles, getAssignableRoles, getPermissionCatalog, getRoleById, getTeamDirectoryRoles, updateRolePermissions, updateRoleStatus } from "../controller/roleController";
import { requirePermission } from "../middlewares/requirePermission";
import { superAdminOnly } from "../middlewares/superAdminOnly";


const roleRoute = express.Router();


roleRoute.get("/permissions/catalog", authMiddleware, requirePermission("role:view"), getPermissionCatalog);
roleRoute.get("/assignable", authMiddleware, requirePermission("user:create"), getAssignableRoles);
roleRoute.get("/team-directory", authMiddleware, requirePermission("user:view"), getTeamDirectoryRoles);
roleRoute.post("/", authMiddleware, requirePermission("role:create"), createRole);
roleRoute.get("/", authMiddleware, requirePermission("role:view"), getAllRoles);
roleRoute.get("/:id", authMiddleware, requirePermission("role:view"), getRoleById);
roleRoute.delete("/:id", authMiddleware, superAdminOnly, requirePermission("role:delete"), deleteRole);
roleRoute.patch("/:id/permissions",
  authMiddleware,
  requirePermission("role:update_permissions"),
  updateRolePermissions
);
roleRoute.patch("/:id/status",
  authMiddleware,
  requirePermission("role:update"),
  updateRoleStatus
);




export default roleRoute
