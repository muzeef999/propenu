import { Response, NextFunction } from "express";
import { AuthRequest } from "./authMiddleware";

const normalizeRoleName = (value?: string) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

const normalizePermission = (value: unknown) => String(value || "").trim().toLowerCase();

export function requirePermission(permission: string, legacyRoles: string[] = []) {
  const required = normalizePermission(permission);

  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const permissions = (Array.isArray(req.user.permissions) ? req.user.permissions : []).map(
      normalizePermission,
    );
    const roleName = normalizeRoleName(req.user.roleName);

    if (roleName === "super_admin" || roleName === "admin" || permissions.includes("*")) {
      return next();
    }

    if (roleName && legacyRoles.map(normalizeRoleName).includes(roleName)) {
      return next();
    }

    if (permissions.includes(required)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      code: "PERMISSION_REQUIRED",
      message: `You do not have permission for this action. Please request the '${required}' permission from a Super Admin.`,
      requiredPermission: required,
    });
  };
}

export function requireAnyPermission(permissionsList: string[], legacyRoles: string[] = []) {
  const required = permissionsList.map(normalizePermission).filter(Boolean);

  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const permissions = (Array.isArray(req.user.permissions) ? req.user.permissions : []).map(
      normalizePermission,
    );
    const roleName = normalizeRoleName(req.user.roleName);

    if (roleName === "super_admin" || roleName === "admin" || permissions.includes("*")) {
      return next();
    }

    if (roleName && legacyRoles.map(normalizeRoleName).includes(roleName)) {
      return next();
    }

    if (required.some((permission) => permissions.includes(permission))) {
      return next();
    }

    return res.status(403).json({
      success: false,
      code: "PERMISSION_REQUIRED",
      message: `You do not have permission for this action. Please request one of: ${required.join(", ")}.`,
      requiredPermissions: required,
    });
  };
}
