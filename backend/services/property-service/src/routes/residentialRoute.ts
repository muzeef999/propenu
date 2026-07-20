// src/routes/residentialRoutes.ts
import express from "express";
import multer from "multer";
import { validateBody } from "../middlewares/validate";
import { parseJsonFields } from "../middlewares/parseJsonFields";
import fallbackCoerceDefault from "../middlewares/fallbackCoerce";
import { ResidentialCreateSchema, ResidentialUpdateSchema } from "../zod/residentialZod";
import { approveProperty, createResidential, createResidentialDraft, deactivateProperty, deleteGalleryImage, deleteResidential, editResidential, finalizeResidential, getAllResidential, getAllResidentialDraftsForAdmin, getMyResidentialDraft, getResidentialBySlug, getResidentialDetail, updateBasicStep, updateDetailsStep, updateLocationStep, verifyResidentialDocument } from "../controller/residentialController";
import { requireActiveSubscription } from "../middlewares/requireActiveSubscription";
import { authMiddleware, AuthRequest } from "../middlewares/authMiddleware";
import { uploadMedia } from "../middlewares/multer";
import { requirePermission } from "../middlewares/requirePermission";

const router = express.Router();

/** json keys that arrive as JSON strings and need parsing */
const jsonKeys = [
  "specifications",
  "amenities",
  "nearbyPlaces",
  "gallery",
  "documents",
  "leads",
  "location",
  "legalChecks",
  "parkingDetails",
  "security",
  "fireSafetyDetails",
  "greenCertification",
  "smartHomeFeatures",
  "relatedProjects", 
  "approval",
  "promotion",
];


router.get("/draft/all", getAllResidentialDraftsForAdmin);
router.post("/draft", authMiddleware, createResidentialDraft);
router.get("/draft/me", authMiddleware, getMyResidentialDraft);
router.patch("/:id/basic", authMiddleware, uploadMedia, parseJsonFields(jsonKeys), updateBasicStep);
router.patch("/:id/location", authMiddleware, parseJsonFields(jsonKeys), updateLocationStep);
router.patch("/:id/details", authMiddleware, uploadMedia, parseJsonFields(jsonKeys), updateDetailsStep);
router.patch("/:id/verification", authMiddleware, uploadMedia, parseJsonFields(jsonKeys), finalizeResidential);
router.patch("/:id/verify-document", authMiddleware, requirePermission("residential:verify_document"), verifyResidentialDocument);

router.post("/:id/approve",  approveProperty);
router.post("/:id/deactive", authMiddleware, deactivateProperty );
router.delete("/:id/gallery/:imageIndex", authMiddleware, deleteGalleryImage);



router.post("/", authMiddleware, uploadMedia,parseJsonFields(jsonKeys), fallbackCoerceDefault,  validateBody(ResidentialCreateSchema), createResidential, requireActiveSubscription);
router.patch("/:id", authMiddleware, uploadMedia, parseJsonFields(jsonKeys), fallbackCoerceDefault, validateBody(ResidentialUpdateSchema), editResidential );
router.get("/", getAllResidential);
router.get("/slug/:slug", getResidentialBySlug);
router.get("/:id", getResidentialDetail);
router.delete("/:id", deleteResidential);

export default router;
