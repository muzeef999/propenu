// src/routes/featurePropertiesRoute.ts
import express, { Request, Response } from "express";
import multer from "multer";
import { getAllHighlightProjects,} from "../controller/featurePropertiesController";
const router = express.Router();


const upload = multer({ storage: multer.memoryStorage() });

const cpUpload = upload.fields([
  { name: "heroImage", maxCount: 1 },
  { name: "heroVideo", maxCount: 1 },
  { name: "galleryFiles", maxCount: 12 },
  { name: "bhkPlanFiles", maxCount: 12 }, 
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


router.get("/", getAllHighlightProjects);



export default router;
