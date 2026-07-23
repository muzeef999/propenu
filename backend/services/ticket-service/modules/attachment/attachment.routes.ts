import express from "express";
import multer from "multer";
import {
  createAttachment,
  deleteAttachment,
  getAttachment,
  listAttachments,
  uploadAttachment,
  updateAttachmentScanStatus,
} from "./attachment.controller";
import { validateAttachment } from "./attachment.validation";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get("/", listAttachments);
router.post("/upload", upload.single("file"), uploadAttachment);
router.post("/", validateAttachment, createAttachment);
router.post("/tickets/:ticketId", validateAttachment, createAttachment);
router.get("/:id", getAttachment);
router.patch("/:id/scan-status", updateAttachmentScanStatus);
router.delete("/:id", deleteAttachment);

export default router;

