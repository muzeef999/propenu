// src/middleware/requirePermission.ts
import { Response, NextFunction } from "express";
import { AuthRequest } from "./authMiddleware";

const normalizeRoleName = (value?: string) =>
  String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");

export function requirePermission(required: string, legacyRoles: string[] = []) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // 👇 super_admin bypass: always allow
    const roleName = normalizeRoleName(req.user.roleName);
    if (roleName === "super_admin" || roleName === "admin") {
      return next();
    }

    if (roleName && legacyRoles.map(normalizeRoleName).includes(roleName)) {
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
