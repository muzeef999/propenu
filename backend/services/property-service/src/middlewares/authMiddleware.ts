import { Request, Response, NextFunction } from "express";
import { JwtUserPayload } from "../types/auth";
import { verifyToken } from "../utils/jwt";
import mongoose from "mongoose";
import Role from "../models/roleModel";

export interface AuthRequest extends Request<
  any,
  any,
  any,
  any
> {
  user?: JwtUserPayload & { id: string };
}

export async function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  // ✅ Guard: token is now guaranteed string
  if (!token) {
    return res.status(401).json({ message: "Token missing" });
  }

  try {
    const decoded = verifyToken(token);
    let roleName = decoded.roleName;
    let permissions = decoded.permissions ?? [];

    // Refresh permissions so role changes take effect without another login.
    if (decoded.roleId && mongoose.Types.ObjectId.isValid(decoded.roleId)) {
      const currentRole = await Role.findById(decoded.roleId)
        .select("name permissions")
        .lean();

      if (currentRole) {
        roleName = currentRole.name;
        permissions = currentRole.permissions ?? [];
      }
    }

    req.user = {
      ...decoded,
      roleName,
      permissions,
      id: decoded.sub, // ✅ standardized user id
    };

    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
}
