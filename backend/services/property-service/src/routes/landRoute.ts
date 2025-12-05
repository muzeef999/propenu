import express from "express";
import multer from "multer";
import { parseJsonFields } from "../middlewares/parseJsonFields";
import fallbackCoerceDefault from "../middlewares/fallbackCoerce";
import { validateBody } from "../middlewares/validate";
import {
  createLand,
  deleteLand,
  editLand,
  getLandBySlug,
  getLandDetail,
  getAllLands,
} from "../controller/landController";
import { CreateLandSchema, UpdateLandSchema } from "../zod/landZod";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const cpUpload = upload.fields([
  { name: "galleryFiles", maxCount: 20 },
  { name: "documents", maxCount: 20 },
  { name: "soilTestReport", maxCount: 1 },
  { name: "conversionCertificateFile", maxCount: 1 },
  { name: "encumbranceCertificateFile", maxCount: 1 },
]);

const jsonKeys = [
  "specifications",
  "amenities",
  "nearbyPlaces",
  "documents",
  "gallery",
  "leads",
  "approvedByAuthority",
  "location",
];

router.post(
  "/",
  cpUpload,
  parseJsonFields(jsonKeys),
  fallbackCoerceDefault,
  validateBody(CreateLandSchema),
  createLand
);

router.patch(
  "/:id",
  cpUpload,
  parseJsonFields(jsonKeys),
  fallbackCoerceDefault,
  validateBody(UpdateLandSchema),
  editLand
);

router.get("/", getAllLands);
router.get("/slug/:slug", getLandBySlug);
router.get("/:id", getLandDetail);
router.delete("/:id", deleteLand);

export default router;
