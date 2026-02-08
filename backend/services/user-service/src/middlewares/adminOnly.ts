import { Response, NextFunction } from "express";
import { AuthRequest } from "./authMiddleware";

/**
 * Allow only admin & super_admin
 */
export const adminOnly = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const role = req.user.roleName;

  if (role !== "admin" && role !== "super_admin") {
    return res.status(403).json({
      message: "Forbidden: admin or super_admin only",
    });
  }

  next();
};
