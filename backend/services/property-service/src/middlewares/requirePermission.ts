import { Response, NextFunction } from "express";
import { AuthRequest } from "./authMiddleware";

export function requirePermission(permission: string) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { roleName, permissions } = req.user;

    // Super Admin and Admin have all permissions bypass
    if (roleName === "super_admin" || roleName === "admin") {
      return next();
    }

    // Check if user has the specific permission or wildcard '*'
    if (permissions && (permissions.includes(permission) || permissions.includes("*"))) {
      return next();
    }

    return res.status(403).json({ message: "Forbidden: Insufficient permissions" });
  };
}
