import {
  getMemory
} from "../memory/conversation.memory";
import { Request, Response, NextFunction} from "express";

export function memoryMiddleware(req:Request, res:Response, next:NextFunction) {

    const sessionId =
  typeof req.headers["x-session-id"]
    === "string"

    ? req.headers["x-session-id"]

    : "guest";

  req.memory =
    getMemory(sessionId);

  next();
}