import express from "express";
import { getAdmin, getSuperAdmin, getsuperagent, getsupermanager, projectAnalytics } from "../controller/analyticsController";
import { authMiddleware } from "../middlewares/authMiddleware";
import { approveProject, getPendingProjects, rejectProject } from "../controller/projectController";

const analyticsRouter = express.Router();

analyticsRouter.get("/analytics/project", projectAnalytics);

analyticsRouter.get("/analytics/superadmin", getSuperAdmin);
analyticsRouter.get("/analytics/admin", getAdmin);
analyticsRouter.get("/analytics/salemanager", authMiddleware, getsupermanager);
analyticsRouter.get("/analytics/saleagent", authMiddleware, getsuperagent);

analyticsRouter.get("/pending-projects", authMiddleware, getPendingProjects);
analyticsRouter.patch("/:id/approve", authMiddleware, approveProject);
analyticsRouter.patch("/:id/reject", authMiddleware, rejectProject);

export default analyticsRouter;
