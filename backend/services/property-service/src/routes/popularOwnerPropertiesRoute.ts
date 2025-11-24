// src/routes/popularOwnerPropertiesRoute.ts
import express from "express";
import multer from "multer";

import {
  createOwnerProperty,
  updateOwnerProperty,
  getOwnerProperties,
  getOwnerPropertyById,
  getOwnerPropertyBySlug,
  deleteOwnerProperty,
  getPropertiesByOwnerUserId,
} from "../controller/popularOwnerPropertiesController";

const router = express.Router();

const upload = multer({ storage: multer.memoryStorage() });

const cpUpload = upload.fields([
  { name: "mediaFiles", maxCount: 20 }
]);

router.post("/", cpUpload, createOwnerProperty);

router.patch("/:id", cpUpload, updateOwnerProperty);

router.get("/", getOwnerProperties);

router.get("/slug/:slug", getOwnerPropertyBySlug);

router.get("/owner/:userId", getPropertiesByOwnerUserId);

router.get("/:id", getOwnerPropertyById);

router.delete("/:id", deleteOwnerProperty);

export default router;
