import { Router } from "express";
import {
  createBuilderInvoice,
  deleteBuilderInvoice,
  getBuilderInvoiceById,
  getBuilderInvoicePdf,
  getBuilderInvoices,
  updateBuilderInvoice,
} from "../controller/builderInvoice";
import { authMiddleware } from "../middlewares/authMiddleware";
import { adminOnly } from "../middlewares/adminOnly";

const router = Router();

router.get("/", authMiddleware, getBuilderInvoices);
router.get("/:id/pdf", authMiddleware, getBuilderInvoicePdf);
router.get("/:id", authMiddleware, getBuilderInvoiceById);
router.post("/", authMiddleware, adminOnly, createBuilderInvoice);
router.patch("/:id", authMiddleware, adminOnly, updateBuilderInvoice);
router.delete("/:id", authMiddleware, adminOnly, deleteBuilderInvoice);

export default router;
