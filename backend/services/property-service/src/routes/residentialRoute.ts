// src/routes/residentialRoutes.ts
import express from "express";
import multer from "multer";
import { validateBody } from "../middlewares/validate";
import { parseJsonFields } from "../middlewares/parseJsonFields";
import fallbackCoerceDefault from "../middlewares/fallbackCoerce";
import { ResidentialCreateSchema, ResidentialUpdateSchema } from "../zod/residentialZod";
import { createResidential, deleteResidential, editResidential, getAllResidential, getResidentialBySlug, getResidentialDetail } from "../controller/residentialController";
import { requireActiveSubscription } from "../middlewares/requireActiveSubscription";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const cpUpload = upload.fields([
  { name: "galleryFiles", maxCount: 20 },
  { name: "documents", maxCount: 20 },
]);

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
];

router.post(
  "/", authMiddleware,cpUpload,parseJsonFields(jsonKeys), fallbackCoerceDefault, requireActiveSubscription,
  validateBody(ResidentialCreateSchema),
  createResidential
);

router.patch(
  "/:id",
  cpUpload,
  parseJsonFields(jsonKeys),
  fallbackCoerceDefault,
  validateBody(ResidentialUpdateSchema),
  editResidential 
);

router.get("/", getAllResidential);
router.get("/slug/:slug", getResidentialBySlug);
router.get("/:id", getResidentialDetail);
router.delete("/:id", deleteResidential);

export default router;
