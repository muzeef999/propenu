import express from "express";
import {
  deleteLocality,
  dedupeLocalities,
  deleteLocation,
  editLocation,
  getAllLocations,
  getAllSearchLocations,
  getLocationById,
  postLocation,
  reverseMajorCity,
} from "../controller/nominatimController";
import { authMiddleware, optionalAuthMiddleware } from "../middlewares/authMiddleware";
import { requirePermission } from "../middlewares/requirePermission";

const nominatimRoute = express.Router();

nominatimRoute.post(
  "/",
  authMiddleware,
  requirePermission("location:create"),
  postLocation
);

nominatimRoute.post(
  "/dedupe-localities",
  authMiddleware,
  requirePermission("location:update"),
  dedupeLocalities
);

nominatimRoute.get("/", optionalAuthMiddleware, getAllLocations);
nominatimRoute.get("/searchable", getAllSearchLocations);
nominatimRoute.get("/reverse-major-city", reverseMajorCity);
nominatimRoute.get("/:id", getLocationById);

nominatimRoute.patch(
  "/:id",
  authMiddleware,
  requirePermission("location:update"),
  editLocation
);

nominatimRoute.delete(
  "/:id",
  authMiddleware,
  requirePermission("location:delete"),
  deleteLocation
);

nominatimRoute.delete(
  "/:id/locality/:name",
  authMiddleware,
  requirePermission("location:delete"),
  deleteLocality
);

export default nominatimRoute;
