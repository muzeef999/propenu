import express from "express";
import {
  deleteLocation,
  editLocation,
  getAllLocations,
  getLocationById,
  postLocation,
} from "../controller/nominatimController";
import { authMiddleware, AuthRequest } from "../middlewares/authMiddleware";

const nominatimRoute = express.Router();

nominatimRoute.post(  "/", authMiddleware,  (req: AuthRequest, res, next) => {
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

nominatimRoute.get("/", getAllLocations);
nominatimRoute.get("/:id", getLocationById);

nominatimRoute.patch(
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

export default nominatimRoute;
