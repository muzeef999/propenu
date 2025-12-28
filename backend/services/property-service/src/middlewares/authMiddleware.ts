// src/middleware/authMiddleware.ts
import { Request, Response, NextFunction } from "express";
import { JwtUserPayload } from "../types/auth";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  user?: JwtUserPayload;
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

  if (!token) {
    return res.status(401).json({ message: "Token missing" });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as unknown as JwtUserPayload;

   
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
}
