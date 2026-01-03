import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";
import { JwtUserPayload } from "../types/auth";

export interface AuthRequest extends Request {
  user?: JwtUserPayload & { id: string };
}

export function authMiddleware(
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

    req.user = {
      ...decoded,
      id: decoded.sub, // ✅ standardized user id
    };

    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
}
