import { NextFunction, Response } from "express";
import { AuthRequest } from "./authMiddleware";

export function superAdminOnly(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });
  if (req.user.roleName !== "super_admin") {
    return res.status(403).json({ message: "Forbidden: Super Admin only" });
  }
  next();
}
