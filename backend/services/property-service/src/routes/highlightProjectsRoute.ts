// src/routes/featurePropertiesRoute.ts
import express, { Request, Response } from "express";
import multer from "multer";
import { getAllHighlightProjects, getCityHighlightProperties,} from "../controller/featurePropertiesController";
const router = express.Router();





router.get("/", getAllHighlightProjects);
router.get("/city", getCityHighlightProperties);


export default router;
