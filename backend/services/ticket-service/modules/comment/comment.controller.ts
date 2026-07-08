import type { Request, Response } from "express";
import { CommentService } from "./comment.service";

const notFound = (res: Response) => res.status(404).json({ success: false, message: "Comment or ticket not found" });

export const createComment = async (req: Request, res: Response) => {
  try {
    const ticketId = req.params.ticketId ?? req.body.ticketId;
    if (!ticketId) return res.status(400).json({ success: false, message: "ticketId is required" });
    const data = await CommentService.create(ticketId, req.body);
    if (!data) return notFound(res);
    return res.status(201).json({ success: true, data });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message || "Internal server error" });
  }
};

export const listComments = async (req: Request, res: Response) => {
  try {
    return res.json({ success: true, ...(await CommentService.list(req.query)) });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message || "Internal server error" });
  }
};

export const updateComment = async (req: Request, res: Response) => {
  try {
    if (!req.params.ticketId || !req.params.commentId) {
      return res.status(400).json({ success: false, message: "Missing ticket id or comment id" });
    }
    const data = await CommentService.update(req.params.ticketId, req.params.commentId, req.body);
    if (!data) return notFound(res);
    return res.json({ success: true, data });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message || "Internal server error" });
  }
};

export const deleteComment = async (req: Request, res: Response) => {
  try {
    if (!req.params.ticketId || !req.params.commentId) {
      return res.status(400).json({ success: false, message: "Missing ticket id or comment id" });
    }
    const data = await CommentService.remove(req.params.ticketId, req.params.commentId, req.body?.actor);
    if (!data) return notFound(res);
    return res.json({ success: true, data });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message || "Internal server error" });
  }
};

