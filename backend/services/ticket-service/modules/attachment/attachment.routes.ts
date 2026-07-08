import express from "express";
import {
  createAttachment,
  deleteAttachment,
  getAttachment,
  listAttachments,
  updateAttachmentScanStatus,
} from "./attachment.controller";
import { validateAttachment } from "./attachment.validation";

const router = express.Router();

router.get("/", listAttachments);
router.post("/", validateAttachment, createAttachment);
router.post("/tickets/:ticketId", validateAttachment, createAttachment);
router.get("/:id", getAttachment);
router.patch("/:id/scan-status", updateAttachmentScanStatus);
router.delete("/:id", deleteAttachment);

export default router;

