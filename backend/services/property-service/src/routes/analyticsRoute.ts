import express from "express";
import { getAdmin, getSuperAdmin, getsuperagent, getsupermanager, projectAnalytics, propertyAnalytics } from "../controller/analyticsController";
import { authMiddleware } from "../middlewares/authMiddleware";
import { approveProject, getPendingProjects, rejectProject } from "../controller/projectController";
import { requireAnyPermission, requirePermission } from "../middlewares/requirePermission";

const analyticsRouter = express.Router();

analyticsRouter.get("/analytics/project", authMiddleware, requireAnyPermission(["dashboard:view", "dashboard:view_reports"]), projectAnalytics);
analyticsRouter.get("/analytics/properties", authMiddleware, requireAnyPermission(["dashboard:view", "dashboard:view_reports"]), propertyAnalytics);

analyticsRouter.get("/analytics/superadmin", getSuperAdmin);
analyticsRouter.get("/analytics/admin", getAdmin);
analyticsRouter.get("/analytics/salemanager", authMiddleware, getsupermanager);
analyticsRouter.get("/analytics/saleagent", authMiddleware, getsuperagent);

analyticsRouter.get("/pending-projects", authMiddleware, requirePermission("project:view", ["sales_manager"]), getPendingProjects);
analyticsRouter.patch("/:id/approve", authMiddleware, requirePermission("project:approve", ["sales_manager"]), approveProject);
analyticsRouter.patch("/:id/reject", authMiddleware, requirePermission("project:reject", ["sales_manager"]), rejectProject);

export default analyticsRouter;
