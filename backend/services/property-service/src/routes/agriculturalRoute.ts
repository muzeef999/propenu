// src/routes/agriculturalRoutes.ts
import express from "express";
import multer from "multer";
import { parseJsonFields } from "../middlewares/parseJsonFields";
import fallbackCoerceDefault from "../middlewares/fallbackCoerce";
import { validateBody } from "../middlewares/validate";
import { AgriculturalCreateSchema, AgriculturalUpdateSchema } from "../zod/agriculturalZod";
import { createAgricultural, deleteAgricultural, editAgricultural, getAgriculturalBySlug, getAgriculturalDetail, getAllAgricultural } from "../controller/agriculturalController";
const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

/**
 * Allowed file fields (must match service handling & model):
 *  - galleryFiles (multiple images) -> gallery[]
 *  - documents (multiple docs) -> documents[]
 *  - soilTestReport (single file) -> soilTestReport
 *
 * NOTE: removed the earlier 'agriFiles' field (not present in model).
 */
const cpUpload = upload.fields([
  { name: "galleryFiles", maxCount: 20 },
  { name: "documents", maxCount: 20 },
  { name: "soilTestReport", maxCount: 1 },
]);

/** keys that may arrive as JSON strings (multipart/form-data) */
const jsonKeys = [
  "gallery",
  "documents",
  "borewellDetails",
  "leads",
  "location",
];

router.post(
  "/",
  cpUpload,
  parseJsonFields(jsonKeys),
  fallbackCoerceDefault,
  validateBody(AgriculturalCreateSchema),
  createAgricultural
);

router.patch(
  "/:id",
  cpUpload,
  parseJsonFields(jsonKeys),
  fallbackCoerceDefault,
  validateBody(AgriculturalUpdateSchema),
  editAgricultural
);

router.get("/", getAllAgricultural);
router.get("/slug/:slug", getAgriculturalBySlug);
router.get("/:id", getAgriculturalDetail);
router.delete("/:id", deleteAgricultural);

export default router;
