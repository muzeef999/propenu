import express from "express";
import { getAdmin, getSuperAdmin, getsuperagent, getsupermanager, projectAnalytics, propertyAnalytics } from "../controller/analyticsController";
import { updateListingFollowUpWorkStatus } from "../controller/listingFollowUpController";
import { authMiddleware } from "../middlewares/authMiddleware";
import { approveProject, getPendingProjects, rejectProject } from "../controller/projectController";
import { requireAnyPermission, requirePermission } from "../middlewares/requirePermission";

const analyticsRouter = express.Router();

analyticsRouter.get("/analytics/project", authMiddleware, requireAnyPermission(["dashboard:view", "dashboard:view_reports"]), projectAnalytics);
analyticsRouter.get("/analytics/properties", authMiddleware, requireAnyPermission(["dashboard:view", "dashboard:view_reports"]), propertyAnalytics);

analyticsRouter.patch(
  "/follow-up/:entity/:id/work-status",
  authMiddleware,
  requireAnyPermission(
    ["user:view", "dashboard:view", "property:view", "project:view"],
    [
      "customer_care",
      "customer_care_executive",
      "customer_care_executives",
      "team_lead",
      "customer_support_team_lead",
      "customer_support_head",
    ],
  ),
  updateListingFollowUpWorkStatus,
);

analyticsRouter.get("/analytics/superadmin", getSuperAdmin);
analyticsRouter.get("/analytics/admin", getAdmin);
analyticsRouter.get("/analytics/salemanager", authMiddleware, getsupermanager);
analyticsRouter.get("/analytics/saleagent", authMiddleware, getsuperagent);

analyticsRouter.get(
  "/pending-projects",
  authMiddleware,
  requirePermission("project:view", [
    "sales_manager",
    "regional_manager",
    "operations_head",
    "business_development_head",
    "ceo",
    "admin",
    "super_admin",
  ]),
  getPendingProjects,
);
analyticsRouter.patch(
  "/:id/approve",
  authMiddleware,
  requirePermission("project:approve", [
    "sales_manager",
    "regional_manager",
    "operations_head",
    "business_development_head",
    "ceo",
    "admin",
    "super_admin",
  ]),
  approveProject,
);
analyticsRouter.patch(
  "/:id/reject",
  authMiddleware,
  requirePermission("project:reject", [
    "sales_manager",
    "regional_manager",
    "operations_head",
    "business_development_head",
    "ceo",
    "admin",
    "super_admin",
  ]),
  rejectProject,
);

export default analyticsRouter;
