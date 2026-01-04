// src/routes/featurePropertiesRoute.ts
import express, { Request, Response } from "express";
import { getAllHighlightProjects, getCityHighlightProperties, getMyFeaturedProjectsController,} from "../controller/featurePropertiesController";
import { authMiddleware } from "../middlewares/authMiddleware";
const router = express.Router();





router.get("/", getAllHighlightProjects);
router.get("/city", getCityHighlightProperties);
router.get("/builder/me", authMiddleware, getMyFeaturedProjectsController)


export default router;
