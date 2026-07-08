import type { Request, Response } from "express";
import { AttachmentService } from "./attachment.service";

const notFound = (res: Response) => res.status(404).json({ success: false, message: "Attachment not found" });

export const createAttachment = async (req: Request, res: Response) => {
  try {
    const ticketId = req.body.ticketId ?? req.params.ticketId;
    const data = await AttachmentService.create({ ...req.body, ticketId });
    return res.status(201).json({ success: true, data });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message || "Internal server error" });
  }
};

export const listAttachments = async (req: Request, res: Response) => {
  try {
    return res.json({ success: true, ...(await AttachmentService.list(req.query)) });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message || "Internal server error" });
  }
};

export const getAttachment = async (req: Request, res: Response) => {
  try {
    if (!req.params.id) return res.status(400).json({ success: false, message: "Missing attachment id" });
    const data = await AttachmentService.get(req.params.id);
    if (!data || data.isDeleted) return notFound(res);
    return res.json({ success: true, data });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message || "Internal server error" });
  }
};

export const updateAttachmentScanStatus = async (req: Request, res: Response) => {
  try {
    if (!req.params.id) return res.status(400).json({ success: false, message: "Missing attachment id" });
    const data = await AttachmentService.updateScanStatus(req.params.id, req.body.scanStatus);
    if (!data) return notFound(res);
    return res.json({ success: true, data });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message || "Internal server error" });
  }
};

export const deleteAttachment = async (req: Request, res: Response) => {
  try {
    if (!req.params.id) return res.status(400).json({ success: false, message: "Missing attachment id" });
    const data = await AttachmentService.remove(req.params.id, req.body?.actor);
    if (!data) return notFound(res);
    return res.json({ success: true, data });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message || "Internal server error" });
  }
};

