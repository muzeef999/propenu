// src/routes/featurePropertiesRoute.ts
import express, { Request, Response } from "express";
import multer from "multer";
import {
  createFeatureProperties,
  deleteFeatureProperties,
  editFeatureProperties,
  getAllFeatureProperties,
  getFeatureBySlug,
  getIndetailFeatureProperties,
} from "../controller/featurePropertiesController";
import { CreateFeaturePropertySchema, UpdateFeaturePropertySchema } from "../zod/validation";
import { validateBody } from "../middlewares/validate";
import { parseJsonFields } from "../middlewares/parseJsonFields";
import fallbackCoerceDefault from "../middlewares/fallbackCoerce";

const router = express.Router();

const anyUpload = multer({ storage: multer.memoryStorage() }).any();

const upload = multer({ storage: multer.memoryStorage() });

const cpUpload = upload.fields([
  { name: "heroImage", maxCount: 1 },
  { name: "heroVideo", maxCount: 1 },
  { name: "galleryFiles", maxCount: 12 },
]);

const jsonKeys = [
  "bhkSummary",
  "specifications",
  "amenities",
  "nearbyPlaces",
  "gallerySummary",
  "sqftRange",
  "leads",
  "banksApproved",
];


router.post("/", cpUpload, parseJsonFields(jsonKeys), fallbackCoerceDefault, validateBody(CreateFeaturePropertySchema), createFeatureProperties);

router.patch("/:id", cpUpload, parseJsonFields(jsonKeys), fallbackCoerceDefault, validateBody(UpdateFeaturePropertySchema), editFeatureProperties);
router.get("/", getAllFeatureProperties);
router.get("/slug/:slug", getFeatureBySlug); // GET by slug
router.get("/:id", getIndetailFeatureProperties); // GET by id

router.delete("/:id", deleteFeatureProperties);



export default router;
