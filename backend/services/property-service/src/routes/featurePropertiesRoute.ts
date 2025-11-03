import express, { Request, Response } from "express";
import { createFeatureProperties, deleteFeatureProperties, editFeatureProperties, getAllFeatureProperties, getIndetailFeatureProperties } from "../controller/featurePropertiesController";
import { CreateFeaturePropertySchema, UpdateFeaturePropertySchema } from "../zod/validation";
import { validateBody } from "../middlewares/validate";

const featurePropertiesRoute = express.Router();

featurePropertiesRoute.post("/", validateBody(CreateFeaturePropertySchema),  createFeatureProperties);
featurePropertiesRoute.get("/",  getAllFeatureProperties);
featurePropertiesRoute.get("/:id", getIndetailFeatureProperties);
featurePropertiesRoute.patch("/:id", validateBody(UpdateFeaturePropertySchema),  editFeatureProperties);
featurePropertiesRoute.delete("/:id", deleteFeatureProperties);


export default featurePropertiesRoute;
