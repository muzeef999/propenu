import { Response, NextFunction } from "express";
import { AuthRequest } from "./authMiddleware";

export function requirePermission(permission: string, legacyRoles: string[] = []) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { roleName, permissions } = req.user;

    // Super Admin and Admin have all permissions bypass
    if (roleName === "super_admin" || roleName === "admin") {
      return next();
    }

    // Preserve access for roles that older routes explicitly allowed while
    // also enabling every custom role through its assigned permission.
    if (roleName && legacyRoles.includes(roleName)) {
      return next();
    }

    // Check if user has the specific permission or wildcard '*'
    if (permissions && (permissions.includes(permission) || permissions.includes("*"))) {
      return next();
    }

    return res.status(403).json({
      success: false,
      code: "PERMISSION_REQUIRED",
      message: `You do not have permission for this action. Please request the '${permission}' permission from a Super Admin.`,
      requiredPermission: permission,
    });
  };
}
