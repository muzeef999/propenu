import { Response, NextFunction } from "express";
import { AuthRequest } from "./authMiddleware";

const normalizeRoleName = (value?: string) =>
  String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");

export function requirePermission(permission: string, legacyRoles: string[] = []) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { permissions } = req.user;
    const roleName = normalizeRoleName(req.user.roleName);

    // Super Admin and Admin have all permissions bypass
    if (roleName === "super_admin" || roleName === "admin") {
      return next();
    }

    // Preserve access for roles that older routes explicitly allowed while
    // also enabling every custom role through its assigned permission.
    if (roleName && legacyRoles.map(normalizeRoleName).includes(roleName)) {
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

export function requireAnyPermission(requiredPermissions: string[], legacyRoles: string[] = []) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    const roleName = normalizeRoleName(req.user.roleName);
    if (roleName === "super_admin" || roleName === "admin") return next();
    if (roleName && legacyRoles.map(normalizeRoleName).includes(roleName)) return next();

    const permissions = Array.isArray(req.user.permissions) ? req.user.permissions : [];
    if (permissions.includes("*") || requiredPermissions.some((permission) => permissions.includes(permission))) {
      return next();
    }

    return res.status(403).json({
      success: false,
      code: "PERMISSION_REQUIRED",
      message: `You do not have permission for this action. Please request one of: ${requiredPermissions.join(", ")}.`,
      requiredPermissions,
    });
  };
}
