// src/routes/residentialRoutes.ts
import express from "express";
import multer from "multer";
import { validateBody } from "../middlewares/validate";
import { parseJsonFields } from "../middlewares/parseJsonFields";
import fallbackCoerceDefault from "../middlewares/fallbackCoerce";
import { ResidentialCreateSchema, ResidentialUpdateSchema } from "../zod/residentialZod";
import { createResidential, createResidentialDraft, deleteResidential, editResidential, finalizeResidential, getAllResidential, getAllResidentialDraftsForAdmin, getResidentialBySlug, getResidentialDetail, updateBasicStep, updateDetailsStep, updateLocationStep, verifyResidentialDocument } from "../controller/residentialController";
import { requireActiveSubscription } from "../middlewares/requireActiveSubscription";
import { authMiddleware, AuthRequest } from "../middlewares/authMiddleware";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const cpUpload = upload.fields([
  { name: "galleryFiles", maxCount: 5 },
    { name: "verificationDocuments", maxCount: 5 }, 
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


router.get("/draft/all", getAllResidentialDraftsForAdmin);
router.post("/draft", authMiddleware, createResidentialDraft);
router.patch("/:id/basic", authMiddleware, cpUpload, parseJsonFields(jsonKeys), updateBasicStep);
router.patch("/:id/location", authMiddleware, parseJsonFields(jsonKeys), updateLocationStep);
router.patch("/:id/details", authMiddleware, cpUpload, parseJsonFields(jsonKeys), updateDetailsStep);
router.patch("/:id/verification", authMiddleware, cpUpload, parseJsonFields(jsonKeys), finalizeResidential);

router.patch("/:id/verify-document", authMiddleware, (req : AuthRequest, res, next) => {
if(!req.user || !["super_admin", "admin"].includes(req.user.roleName || "")){
       return res.status(403).json({message:"Forbidden only admin/super_admin can see the users"});
    }
    next();
},  verifyResidentialDocument);




router.post("/", authMiddleware,cpUpload,parseJsonFields(jsonKeys), fallbackCoerceDefault, requireActiveSubscription, validateBody(ResidentialCreateSchema), createResidential);
router.patch("/:id", cpUpload, parseJsonFields(jsonKeys), fallbackCoerceDefault, validateBody(ResidentialUpdateSchema), editResidential );
router.get("/", getAllResidential);
router.get("/slug/:slug", getResidentialBySlug);
router.get("/:id", getResidentialDetail);
router.delete("/:id", deleteResidential);

export default router;
