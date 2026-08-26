// src/middleware/requirePermission.ts
import { Response, NextFunction } from "express";
import { AuthRequest } from "./authMiddleware";
import Role from "../models/roleModel";

const normalizeRoleName = (value?: string) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

const formatRoleLabel = (name: string, label?: string) => {
  const trimmed = String(label || "").trim();
  if (trimmed) return trimmed;
  return String(name || "")
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

async function rolesAllowedForPermission(required: string) {
  const roles = await Role.find({
    isActive: { $ne: false },
    $or: [
      { name: { $in: ["super_admin", "admin"] } },
      { permissions: required },
    ],
  })
    .select("name label")
    .sort({ name: 1 })
    .lean();

  return roles.map((role) => ({
    name: role.name,
    label: formatRoleLabel(role.name, role.label),
  }));
}

export function requirePermission(required: string | string[], legacyRoles: string[] = []) {
  const requiredList = (Array.isArray(required) ? required : [required]).filter(Boolean);

  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const roleName = normalizeRoleName(req.user.roleName);
    const permissions = Array.isArray(req.user.permissions)
      ? req.user.permissions
      : [];

    // Built-in full access
    if (
      roleName === "super_admin" ||
      roleName === "admin" ||
      permissions.includes("*")
    ) {
      return next();
    }

    if (roleName && legacyRoles.map(normalizeRoleName).includes(roleName)) {
      return next();
    }

    const hasPermission = requiredList.some((perm) => permissions.includes(perm));

    if (!hasPermission) {
      const primary = requiredList[0] || "permission";
      const allowedRoles = await rolesAllowedForPermission(primary);
      const yourRoleLabel = formatRoleLabel(roleName || "unknown", roleName);
      const allowedLabels = allowedRoles.map((role) => role.label).join(", ");

      return res.status(403).json({
        success: false,
        code: "PERMISSION_REQUIRED",
        error: `Permission denied. Your role (${yourRoleLabel}) cannot create/manage this. Required permission: '${requiredList.join("' or '")}'.`,
        message: `Your role (${yourRoleLabel}) does not have '${requiredList.join("' or '")}'. Roles that can access this: ${allowedLabels || "Super Admin, Admin"}. Ask a Super Admin to grant access on your role.`,
        requiredPermission: requiredList.join(" | "),
        yourRole: roleName || null,
        yourRoleLabel,
        allowedRoles,
        howToGetAccess: `Ask a Super Admin (Access Control → Roles) to add '${requiredList.join("' or '")}' to your role, or sign in with one of: ${allowedLabels || "Super Admin / Admin"}.`,
      });
    }

    next();
  };
}
