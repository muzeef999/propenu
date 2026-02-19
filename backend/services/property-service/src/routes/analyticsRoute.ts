import express from "express";
import { getAdmin, getSuperAdmin, getsuperagent, getsupermanager } from "../controller/analyticsController";
import { authMiddleware } from "../middlewares/authMiddleware";

const analyticsRouter = express.Router();

analyticsRouter.get("/analytics/superadmin", getSuperAdmin);
analyticsRouter.get("/analytics/admin", getAdmin);
analyticsRouter.get("/analytics/supermanager", authMiddleware, getsupermanager);
analyticsRouter.get("/analytics/superagent", authMiddleware, getsuperagent);

export default analyticsRouter;
