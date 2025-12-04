// src/middleware/requirePermission.ts
import { Response, NextFunction } from "express";
import { AuthRequest } from "./authMiddleware";

export function requirePermission(required: string) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // 👇 super_admin bypass: always allow
    if (req.user.roleName === "super_admin") {
      return next();
    }

    const permissions = req.user.permissions || [];

    if (!permissions.includes(required)) {
      return res.status(403).json({ message: "Forbidden: missing permission" });
    }

    next();
  };
}
