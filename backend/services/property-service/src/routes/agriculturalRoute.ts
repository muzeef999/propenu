// src/routes/agriculturalRoutes.ts
import express from "express";
import multer from "multer";
import { parseJsonFields } from "../middlewares/parseJsonFields";
import fallbackCoerceDefault from "../middlewares/fallbackCoerce";
import { validateBody } from "../middlewares/validate";
import { AgriculturalCreateSchema, AgriculturalUpdateSchema } from "../zod/agriculturalZod";
import { createAgricultural, createAgriculturalDraft, deleteAgricultural, editAgricultural, finalizeAgricultural, getAgriculturalBySlug, getAgriculturalDetail, getAllAgricultural, getAllAgriculturalDraftsForAdmin, updateAgriculturalBasicStep, updateAgriculturalDetailsStep, updateAgriculturalLocationStep, verifyAgricultiralDocument } from "../controller/agriculturalController";
import { requireActiveSubscription } from "../middlewares/requireActiveSubscription";
import { authMiddleware, AuthRequest } from "../middlewares/authMiddleware";
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
  { name: "galleryFiles", maxCount: 5 },
    { name: "verificationDocuments", maxCount: 5 }, 
]);

/** keys that may arrive as JSON strings (multipart/form-data) */
const jsonKeys = [
  "gallery",
  "documents",
  "borewellDetails",
  "leads",
  "location",
  "legalChecks",
];

router.post(
  "/",
  authMiddleware,
  cpUpload,
  parseJsonFields(jsonKeys),
  fallbackCoerceDefault,
  validateBody(AgriculturalCreateSchema),
  requireActiveSubscription,
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


router.get("/draft/all", getAllAgriculturalDraftsForAdmin);
router.post("/draft", authMiddleware, createAgriculturalDraft);
router.patch("/:id/basic", authMiddleware, updateAgriculturalBasicStep);
router.patch("/:id/location", authMiddleware, updateAgriculturalLocationStep);
router.patch("/:id/details", authMiddleware, cpUpload, parseJsonFields(jsonKeys),updateAgriculturalDetailsStep);
router.patch("/:id/verification", authMiddleware, cpUpload,parseJsonFields(jsonKeys), finalizeAgricultural);


router.patch("/:id/verify-document", authMiddleware, (req : AuthRequest, res, next) => {
if(!req.user || !["super_admin", "admin"].includes(req.user.roleName || "")){
       return res.status(403).json({message:"Forbidden only admin/super_admin can see the users"});
    }
    next();
},  verifyAgricultiralDocument);


export default router;
