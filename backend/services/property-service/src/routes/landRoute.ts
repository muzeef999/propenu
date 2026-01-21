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
  createLandDraft,
  updateLandBasicStep,
  updateLandLocationStep,
  updateLandDetailsStep,
  finalizeLand,
  getAllLandDraftsForAdmin,
} from "../controller/landController";
import { CreateLandSchema, UpdateLandSchema } from "../zod/landZod";
import { requireActiveSubscription } from "../middlewares/requireActiveSubscription";
import { authMiddleware } from "../middlewares/authMiddleware";

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
  "dimensions",
  "leads",
  "approvedByAuthority",
  "location",
  "legalChecks",
];

router.post(
  "/",
  authMiddleware,
  cpUpload,
  parseJsonFields(jsonKeys),

  requireActiveSubscription,
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


router.post("/draft", authMiddleware, createLandDraft);
router.patch("/:id/basic",authMiddleware,cpUpload,parseJsonFields(jsonKeys),updateLandBasicStep);
router.patch("/:id/location", authMiddleware, parseJsonFields(jsonKeys), updateLandLocationStep);
router.patch("/:id/details", authMiddleware, cpUpload, parseJsonFields(jsonKeys), updateLandDetailsStep);
router.patch("/:id/verification", authMiddleware, parseJsonFields(jsonKeys), finalizeLand);
router.get("/draft/all", getAllLandDraftsForAdmin);


export default router;
