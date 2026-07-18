import { Response, NextFunction } from "express";
import { AuthRequest } from "./authMiddleware";

export function adminOnly(req: AuthRequest, res: Response, next: NextFunction) {
  const roleName = String(req.user?.roleName || "").toLowerCase();

  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  if (!["admin", "super_admin"].includes(roleName)) {
    return res.status(403).json({
      success: false,
      message: "Only admin and super admin can perform this action",
    });
  }

  return next();
}
