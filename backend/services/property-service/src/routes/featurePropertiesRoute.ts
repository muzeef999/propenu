// src/routes/featurePropertiesRoute.ts
import express, { Request, Response } from "express";
import multer from "multer";
import {
  createFeatureProperties,
  deleteFeatureProperties,
  editFeatureProperties,
  getAllFeatureProperties,
  getCityFeatureProperties,
  getFeatureBySlug,
  getIndetailFeatureProperties,
  getSearchFeatureProperties,
} from "../controller/featurePropertiesController";
import {
  CreateFeaturePropertySchema,
  UpdateFeaturePropertySchema,
} from "../zod/validation";
import { validateBody } from "../middlewares/validate";
import { parseJsonFields } from "../middlewares/parseJsonFields";
import fallbackCoerceDefault from "../middlewares/fallbackCoerce";
import { authMiddleware, AuthRequest } from "../middlewares/authMiddleware";

const router = express.Router();

const upload = multer({ storage: multer.memoryStorage() });

const cpUpload = upload.fields([
  { name: "heroImage", maxCount: 1 },
  { name: "heroVideo", maxCount: 1 },
  { name: "galleryFiles", maxCount: 12 },
  { name: "bhkPlanFiles", maxCount: 12 },
  { name: "aboutImage", maxCount: 1 },
  { name: "logo", maxCount: 1 },
    { name: "brochure", maxCount: 1 }, 
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
  "location",
  "city",
  "aboutSummary",
];



router.post("/",  cpUpload, parseJsonFields(jsonKeys), authMiddleware, fallbackCoerceDefault, validateBody(CreateFeaturePropertySchema),
  (req: AuthRequest, res, next) => {
    if (!req.user || !["super_admin", "admin", "builder"].includes(req.user.roleName || "") ) {
      return res.status(403).json({
          message: "only admin/super_admin/builder can post the project",
        });
    }
    next();
  },
  createFeatureProperties
);

router.patch("/:id",cpUpload, parseJsonFields(jsonKeys), authMiddleware, fallbackCoerceDefault, validateBody(UpdateFeaturePropertySchema), 
(req: AuthRequest, res, next)=> {
if (!req.user || !["super_admin", "admin", "builder"].includes(req.user.roleName || "") ) {
      return res.status(403).json({
          message: "only admin/super_admin/builder can post the project",
        });
    }
    next();
},
editFeatureProperties
);

// router.get("/analytics", );
router.get("/", getAllFeatureProperties);
router.get("/city", getCityFeatureProperties);
router.get("/search", getSearchFeatureProperties);
router.get("/slug/:slug", getFeatureBySlug);
router.get("/:id", getIndetailFeatureProperties);
router.delete("/:id", deleteFeatureProperties);

export default router;
