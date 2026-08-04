import { Router } from "express";
import {
  captureInteraction,
  getAllUsersActivity,
  getAssignedUserActivity,
  getUserJourney,
  getUserSession,
} from "../controller/userInteractionController";
import { authMiddleware } from "../middlewares/authMiddleware";
import { requireAnyPermission, requirePermission } from "../middlewares/requirePermission";

const router = Router();

const CCE_AND_OVERSIGHT_ROLES = [
  "super_admin",
  "admin",
  "customer_care",
  "customer_care_executive",
  "customer_care_executives",
  "team_lead",
  "customer_support_team_lead",
  "team_leads",
  "customer_support_head",
];

router.post("/", authMiddleware, captureInteraction);

/** Admin platform-wide feed — unchanged access model */
router.get(
  "/all-users-activity",
  authMiddleware,
  requirePermission("user:view", ["super_admin", "admin"]),
  getAllUsersActivity,
);

/**
 * Single assigned-user activity (Client Progress Queue).
 * CCE: only their followUpAssignedTo users. Oversight/admin: any user.
 */
router.get(
  "/assigned-user-activity/:userId",
  authMiddleware,
  requireAnyPermission(["user:view", "lead:view"], CCE_AND_OVERSIGHT_ROLES),
  getAssignedUserActivity,
);

router.get(
  "/user-journey/:userId",
  authMiddleware,
  requirePermission("user:view", ["super_admin", "admin"]),
  getUserJourney,
);
router.get(
  "/user-journey/:userId/sessions/:sessionId",
  authMiddleware,
  requirePermission("user:view", ["super_admin", "admin"]),
  getUserSession,
);

export default router;
