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
import { requirePermission } from "../middlewares/requirePermission";

const router = Router();

router.get("/", authMiddleware, requirePermission("builder_invoice:view"), getBuilderInvoices);
router.get("/:id/pdf", authMiddleware, requirePermission("builder_invoice:view"), getBuilderInvoicePdf);
router.get("/:id", authMiddleware, requirePermission("builder_invoice:view"), getBuilderInvoiceById);
router.post("/", authMiddleware, requirePermission("builder_invoice:create"), createBuilderInvoice);
router.patch("/:id", authMiddleware, requirePermission("builder_invoice:update"), updateBuilderInvoice);
router.delete("/:id", authMiddleware, requirePermission("builder_invoice:delete"), deleteBuilderInvoice);

export default router;
