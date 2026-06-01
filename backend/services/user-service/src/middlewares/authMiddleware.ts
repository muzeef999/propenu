// src/middleware/authMiddleware.ts
import { Request, Response, NextFunction } from "express";
import { JwtUserPayload } from "../types/auth";
import jwt from "jsonwebtoken";
import Role from "../models/roleModel";
import User from "../models/userModel";

export interface AuthRequest extends Request {
  user?: JwtUserPayload;
}

export async function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  const parts = authHeader.split(" ");
  const token = parts[1];

  if (!token) {
    return res.status(401).json({ message: "Token missing" });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string,
    ) as unknown as JwtUserPayload;

    if (!decoded.sub) {
      return res.status(401).json({ message: "Invalid token payload" });
    }

    let roleName: string | undefined;
    let permissions: string[] = [];

    if (decoded.roleId) {
      const role = await Role.findById(decoded.roleId)
        .select("name permissions")
        .lean();

      if (!role) {
        return res.status(401).json({ message: "Invalid role" });
      }

      roleName = role.name;
      permissions = role.permissions ?? [];
    }

    const activeUser = await User.findById(decoded.sub)
      .select("_id isActive")
      .lean();

    if (!activeUser || activeUser.isActive === false) {
      return res.status(401).json({ message: "Account is no longer active" });
    }

    req.user = {
      ...decoded,
      _id: decoded.sub,
      id: decoded.sub,
      roleName,
      permissions,
    };

    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
}
