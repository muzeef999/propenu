// src/routes/popularOwnerPropertiesRoute.ts
import express from "express";
import multer from "multer";

import {
  getPropertiesByOwner
} from "../controller/popularOwnerPropertiesController";

const router = express.Router();

router.get("/", getPropertiesByOwner);

export default router;


