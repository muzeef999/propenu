import express from "express";
import multer from "multer";
import { parseJsonFields } from "../middlewares/parseJsonFields";
import fallbackCoerceDefault from "../middlewares/fallbackCoerce";
import { validateBody } from "../middlewares/validate";
// import { CommercialCreateSchema, CommercialUpdateSchema } from "../zod/commercialZod"; // optional

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const cpUpload = upload.fields([
  { name: "galleryFiles", maxCount: 20 },
  { name: "leaseDocuments", maxCount: 20 },
  { name: "fireNOCFile", maxCount: 1 },
  { name: "occupancyCertificateFile", maxCount: 1 },
]);

const jsonKeys = [
  "location",
  "gallery",
  "leaseDocuments",
  "tenantInfo",
  "buildingManagement",
  "pantry",
  "amenities",
  "specifications",
  "nearbyPlaces"
];

import {  createCommercial,  editCommercial,  getAllCommercial,  getCommercialBySlug,  getCommercialDetail,  deleteCommercial,} from "../controller/commercialController";

/** POST */
router.post("/", cpUpload,  parseJsonFields(jsonKeys), fallbackCoerceDefault, createCommercial);
router.patch("/:id",cpUpload, parseJsonFields(jsonKeys), fallbackCoerceDefault, editCommercial);
router.get("/", getAllCommercial);
router.get("/slug/:slug", getCommercialBySlug);
router.get("/:id", getCommercialDetail);
router.delete("/:id", deleteCommercial);

export default router;
