import { NextFunction, Response } from "express";
import { AuthRequest } from "./authMiddleware";

export function superAdminOnly(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });
  const roleName = String(req.user.roleName || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  if (roleName !== "super_admin") {
    return res.status(403).json({ message: "Forbidden: Super Admin only" });
  }
  next();
}
