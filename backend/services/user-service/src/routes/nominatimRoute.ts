import express from "express";
import {
  deleteLocality,
  dedupeLocalities,
  deleteLocation,
  editLocation,
  getAllLocations,
  getLocationById,
  postLocation,
  reverseMajorCity,
} from "../controller/nominatimController";
import { authMiddleware, AuthRequest } from "../middlewares/authMiddleware";

const nominatimRoute = express.Router();

nominatimRoute.post("/", authMiddleware,  (req: AuthRequest, res, next) => {
    if (
      !req.user ||
      !["super_admin", "admin"].includes(req.user.roleName || "")
    ) {
      return res
        .status(403)
        .json({
          message: "Forbidden: only admin/super_admin can change roles",
        });
    }
    next();
  },
  postLocation
);

nominatimRoute.post(
  "/dedupe-localities",
  authMiddleware,
  (req: AuthRequest, res, next) => {
    if (
      !req.user ||
      !["super_admin", "admin"].includes(req.user.roleName || "")
    ) {
      return res.status(403).json({
        message: "Forbidden: only admin/super_admin allowed",
      });
    }
    next();
  },
  dedupeLocalities
);

nominatimRoute.get("/", getAllLocations);
nominatimRoute.get("/reverse-major-city", reverseMajorCity);
nominatimRoute.get("/:id", getLocationById);
nominatimRoute.patch("/:id", authMiddleware,(req: AuthRequest, res, next) => {
    if (
      !req.user ||
      !["super_admin", "admin"].includes(req.user.roleName || "")
    ) {
      return res.status(403).json({
        message: "Forbidden: only admin/super_admin can change roles",
      });
    }
    next();
  },
  editLocation
);

nominatimRoute.delete(
  "/:id",
  authMiddleware,
  (req: AuthRequest, res, next) => {
    if (
      !req.user ||
      !["super_admin", "admin"].includes(req.user.roleName || "")
    ) {
      return res.status(403).json({
        message: "Forbidden: only admin/super_admin can change roles",
      });
    }
    next();
  },
  deleteLocation
);

nominatimRoute.delete(
  "/:id/locality/:name",
  authMiddleware,
  (req: AuthRequest, res, next) => {
    if (
      !req.user ||
      !["super_admin", "admin"].includes(req.user.roleName || "")
    ) {
      return res.status(403).json({
        message: "Forbidden: only admin/super_admin allowed",
      });
    }
    next();
  },
  deleteLocality
);

export default nominatimRoute;

