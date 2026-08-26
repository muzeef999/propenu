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

/** Anyone who can open Locations admin (location:view) can manage cities/localities */
const LOCATION_MANAGE_PERMS = [
  "location:update",
  "location:create",
  "location:delete",
  "location:view",
] as const;

const LOCATION_MANAGE_ROLES = [
  "super_admin",
  "admin",
  "business_development_head",
  "operations_head",
  "ceo",
  "regional_manager",
  "sales_manager",
  "founder",
];

nominatimRoute.post(
  "/",
  authMiddleware,
  requirePermission([...LOCATION_MANAGE_PERMS], LOCATION_MANAGE_ROLES),
  postLocation
);

nominatimRoute.post(
  "/dedupe-localities",
  authMiddleware,
  requirePermission([...LOCATION_MANAGE_PERMS], LOCATION_MANAGE_ROLES),
  dedupeLocalities
);

nominatimRoute.get("/", optionalAuthMiddleware, getAllLocations);
nominatimRoute.get("/searchable", getAllSearchLocations);
nominatimRoute.get("/reverse-major-city", reverseMajorCity);
nominatimRoute.get("/:id", getLocationById);

nominatimRoute.patch(
  "/:id",
  authMiddleware,
  requirePermission([...LOCATION_MANAGE_PERMS], LOCATION_MANAGE_ROLES),
  editLocation
);

nominatimRoute.delete(
  "/:id",
  authMiddleware,
  requirePermission(
    ["location:delete", "location:update", "location:view"],
    LOCATION_MANAGE_ROLES,
  ),
  deleteLocation
);

nominatimRoute.delete(
  "/:id/locality/:name",
  authMiddleware,
  requirePermission(
    ["location:delete", "location:update", "location:view"],
    LOCATION_MANAGE_ROLES,
  ),
  deleteLocality
);

export default nominatimRoute;
