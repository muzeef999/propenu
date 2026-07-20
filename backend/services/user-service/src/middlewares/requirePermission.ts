// src/middleware/requirePermission.ts
import { Response, NextFunction } from "express";
import { AuthRequest } from "./authMiddleware";

export function requirePermission(required: string, legacyRoles: string[] = []) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // 👇 super_admin bypass: always allow
    if (req.user.roleName === "super_admin" || req.user.roleName === "admin") {
      return next();
    }

    if (req.user.roleName && legacyRoles.includes(req.user.roleName)) {
      return next();
    }

    const permissions = req.user.permissions || [];

    if (!permissions.includes(required)) {
      return res.status(403).json({
        success: false,
        code: "PERMISSION_REQUIRED",
        message: `You do not have permission for this action. Please request the '${required}' permission from a Super Admin.`,
        requiredPermission: required,
      });
    }

    next();
  };
}
