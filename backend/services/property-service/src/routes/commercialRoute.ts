import express from "express";
import multer from "multer";
import { parseJsonFields } from "../middlewares/parseJsonFields";
import fallbackCoerceDefault from "../middlewares/fallbackCoerce";
import { validateBody } from "../middlewares/validate";
// import { CommercialCreateSchema, CommercialUpdateSchema } from "../zod/commercialZod"; // optional

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const cpUpload = upload.fields([
  { name: "galleryFiles", maxCount: 5 },
    { name: "verificationDocuments", maxCount: 5 }, 
]);

const jsonKeys = [
  "location",
  "gallery",
  "tenantInfo",
  "buildingManagement",
  "pantry",
  "amenities",
  "specifications",
  "nearbyPlaces",
  "legalChecks",
  "parkingDetails",
  "fireSafety",
];

import {  createCommercial,  editCommercial,  getAllCommercial,  getCommercialBySlug,  getCommercialDetail,  deleteCommercial, createCommercialDraft, updateCommercialBasicStep, updateCommercialLocationStep, updateCommercialDetailsStep, finalizeCommercial, getAllCommercialDraftsForAdmin,} from "../controller/commercialController";
import { requireActiveSubscription } from "../middlewares/requireActiveSubscription";
import { authMiddleware } from "../middlewares/authMiddleware";

/** POST */
router.post("/", authMiddleware, cpUpload,  parseJsonFields(jsonKeys), fallbackCoerceDefault, createCommercial,  requireActiveSubscription);
router.patch("/:id",cpUpload, parseJsonFields(jsonKeys), fallbackCoerceDefault, editCommercial);
router.get("/", getAllCommercial);
router.get("/slug/:slug", getCommercialBySlug);
router.get("/:id", getCommercialDetail);
router.delete("/:id", deleteCommercial);

router.get("/draft/all", getAllCommercialDraftsForAdmin);
router.post("/draft", authMiddleware, createCommercialDraft);
router.patch("/:id/basic", authMiddleware, cpUpload, parseJsonFields(jsonKeys), updateCommercialBasicStep);
router.patch("/:id/location", authMiddleware, parseJsonFields(jsonKeys), updateCommercialLocationStep);
router.patch("/:id/details", authMiddleware, cpUpload, parseJsonFields(jsonKeys), updateCommercialDetailsStep);
router.patch("/:id/verification", authMiddleware, cpUpload, parseJsonFields(jsonKeys), finalizeCommercial);


export default router;
