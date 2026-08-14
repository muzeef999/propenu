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

export function requirePermission(required: string, legacyRoles: string[] = []) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // 👇 super_admin / admin bypass: always allow
    const roleName = normalizeRoleName(req.user.roleName);
    if (roleName === "super_admin" || roleName === "admin") {
      return next();
    }

    if (roleName && legacyRoles.map(normalizeRoleName).includes(roleName)) {
      return next();
    }

    const permissions = req.user.permissions || [];

    if (!permissions.includes(required)) {
      const allowedRoles = await rolesAllowedForPermission(required);
      const yourRoleLabel = formatRoleLabel(roleName || "unknown", roleName);
      const allowedLabels = allowedRoles.map((role) => role.label).join(", ");

      return res.status(403).json({
        success: false,
        code: "PERMISSION_REQUIRED",
        error: `Permission denied. Your role (${yourRoleLabel}) cannot create/manage this. Required permission: '${required}'.`,
        message: `Your role (${yourRoleLabel}) does not have '${required}'. Roles that can access this: ${allowedLabels || "Super Admin, Admin"}. Ask a Super Admin to grant '${required}' on your role.`,
        requiredPermission: required,
        yourRole: roleName || null,
        yourRoleLabel,
        allowedRoles,
        howToGetAccess: `Ask a Super Admin (Access Control → Roles) to add '${required}' to your role, or sign in with one of: ${allowedLabels || "Super Admin / Admin"}.`,
      });
    }

    next();
  };
}
