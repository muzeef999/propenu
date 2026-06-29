// src/routes/agriculturalRoutes.ts
import express from "express";
import multer from "multer";
import { parseJsonFields } from "../middlewares/parseJsonFields";
import fallbackCoerceDefault from "../middlewares/fallbackCoerce";
import { validateBody } from "../middlewares/validate";
import { AgriculturalCreateSchema, AgriculturalUpdateSchema } from "../zod/agriculturalZod";
import { approveAgriculturalProperty, createAgricultural, createAgriculturalDraft, deactivateAgriculturalProperty, deleteAgricultural, deleteAgriculturalGalleryImage, editAgricultural, finalizeAgricultural, getAgriculturalBySlug, getAgriculturalDetail, getAllAgricultural, getAllAgriculturalDraftsForAdmin, getMyAgriculturalDraft, updateAgriculturalBasicStep, updateAgriculturalDetailsStep, updateAgriculturalLocationStep, verifyAgricultiralDocument } from "../controller/agriculturalController";
import { requireActiveSubscription } from "../middlewares/requireActiveSubscription";
import { authMiddleware, AuthRequest } from "../middlewares/authMiddleware";
import { uploadMedia } from "../middlewares/multer";
const router = express.Router();



/** keys that may arrive as JSON strings (multipart/form-data) */
const jsonKeys = [
  "gallery",
  "documents",
  "borewellDetails",
  "totalArea",
  "roadWidth",
  "leads",
  "location",
  "legalChecks",
  "approval",
  "promotion",
];

router.post(
  "/",
  authMiddleware,
  uploadMedia,
  parseJsonFields(jsonKeys),
  fallbackCoerceDefault,
  validateBody(AgriculturalCreateSchema),
  requireActiveSubscription,
  createAgricultural
);

router.patch(
  "/:id",
  uploadMedia,
  parseJsonFields(jsonKeys),
  fallbackCoerceDefault,
  validateBody(AgriculturalUpdateSchema),
  editAgricultural
);


router.get("/draft/me", authMiddleware, getMyAgriculturalDraft)
router.get("/draft/all", getAllAgriculturalDraftsForAdmin);

router.get("/", getAllAgricultural);
router.get("/slug/:slug", getAgriculturalBySlug);
router.get("/:id", getAgriculturalDetail);
router.delete("/:id", deleteAgricultural);

router.post("/draft", authMiddleware, createAgriculturalDraft);
router.patch(
  "/:id/basic",
  authMiddleware,
  uploadMedia,
  parseJsonFields(jsonKeys),
  updateAgriculturalBasicStep,
);
router.patch("/:id/location",authMiddleware,parseJsonFields(jsonKeys),updateAgriculturalLocationStep,);
router.patch("/:id/details", authMiddleware, uploadMedia, parseJsonFields(jsonKeys),updateAgriculturalDetailsStep);
router.patch("/:id/verification", authMiddleware, uploadMedia,parseJsonFields(jsonKeys),   finalizeAgricultural);


router.patch("/:id/verify-document", authMiddleware, (req : AuthRequest, res, next) => {
if(!req.user || !["super_admin", "admin"].includes(req.user.roleName || "")){
       return res.status(403).json({message:"Forbidden only admin/super_admin can see the users"});
    }
    next();
},  verifyAgricultiralDocument);


router.post("/:id/approve",  approveAgriculturalProperty);
router.post("/:id/deactive", authMiddleware, deactivateAgriculturalProperty);

router.delete("/:id/gallery/:imageIndex", authMiddleware, deleteAgriculturalGalleryImage);



export default router;
