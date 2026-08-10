import express from "express";
import { adminCreateRequestOtp, adminCreateUpdateLocation, adminCreateVerifyOtp, adminDeleteUser, adminSetUserActive, assignManager, assignReportsTo, claimSeClient, createRequestOtp,  createVerifyOtp, deleteMyAccount, getAllUsers, getEligibleReportsTo, getManagerTeamDetails, getRoleHierarchyGuide, me, requestAdminUserPhoneChangeOtp, requestOTP, searchUsers, updateLocationOtp, updateUser, updateUserProfileById, updateUserRole, verifyOtp } from "../controller/authController";
import { updateFollowUpWorkStatus } from "../controller/followUpWorkController";
import { getUserWorkingLocations, updateUserWorkingLocations } from "../controller/workingLocationsController";
import { authMiddleware, AuthRequest } from "../middlewares/authMiddleware";
import { superAdminOnly } from "../middlewares/superAdminOnly";
import { requirePermission } from "../middlewares/requirePermission";


const authRoute = express.Router();

const requireAdminOrSuperAdmin = (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  if (!req.user || !["super_admin", "admin"].includes(req.user.roleName || "")) {
    return res.status(403).json({ message: "Forbidden: only admin/super_admin allowed" });
  }

  next();
};

const requireRoleTransferAccess = (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  if (!req.user) {
    return res.status(403).json({ message: "Forbidden: role transfer access denied" });
  }

  const roleName = req.user.roleName || "";
  const permissions = req.user.permissions || [];
  const allowedByRole = ["super_admin", "admin", "regional_manager"].includes(roleName);
  const allowedByPermission = permissions.includes("user:update");

  if (!allowedByRole && !allowedByPermission) {
    return res.status(403).json({ message: "Forbidden: role transfer access denied" });
  }

  next();
};

/** Create Credentials + Assign + Transfer all need eligible manager lists. */
const requireReportsToLookup = (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const roleName = String(req.user.roleName || "").toLowerCase();
  if (["super_admin", "admin", "regional_manager"].includes(roleName)) {
    return next();
  }
  const permissions = req.user.permissions || [];
  if (
    permissions.includes("team:assign_manager") ||
    permissions.includes("user:create") ||
    permissions.includes("user:update")
  ) {
    return next();
  }
  return res.status(403).json({
    message: "You do not have permission to view reports-to options",
  });
};

authRoute.post("/request-otp",  requestOTP);
authRoute.post("/verify-otp",  verifyOtp);
authRoute.post("/request-otp/create",  createRequestOtp);
authRoute.post("/verify-otp/create",  createVerifyOtp);
authRoute.post("/update-location/create", authMiddleware, updateLocationOtp);
authRoute.post("/request-otp/admin-create", adminCreateRequestOtp);
authRoute.post("/verify-otp/admin-create", adminCreateVerifyOtp);
authRoute.post("/update-location/admin-create", authMiddleware, adminCreateUpdateLocation);
// Additive, protected aliases used by the new Access Control pages.
// Existing admin-create endpoints remain unchanged for backward compatibility.
authRoute.post("/admin-credentials/request-otp", authMiddleware, requirePermission("user:create"), adminCreateRequestOtp);
authRoute.post("/admin-credentials/verify-otp", authMiddleware, requirePermission("user:create"), adminCreateVerifyOtp);



authRoute.get("/me", authMiddleware, me);
authRoute.patch("/me/update", authMiddleware, updateUser);
authRoute.delete("/me", authMiddleware, deleteMyAccount);
authRoute.get("/search", authMiddleware, searchUsers);
authRoute.post("/assign-manager", authMiddleware, requirePermission("team:assign_manager", ["regional_manager"]), assignManager);
// Additive hierarchy-wide reporting (keeps /assign-manager for legacy sales flow)
authRoute.get(
  "/eligible-reports-to",
  authMiddleware,
  requireReportsToLookup,
  getEligibleReportsTo,
);
authRoute.get(
  "/role-hierarchy",
  authMiddleware,
  requireReportsToLookup,
  getRoleHierarchyGuide,
);
authRoute.post(
  "/assign-reports-to",
  authMiddleware,
  requirePermission("team:assign_manager", ["regional_manager", "super_admin", "admin"]),
  assignReportsTo,
);
authRoute.post(
  "/se-claim-client",
  authMiddleware,
  requirePermission("user:create", [
    "sales_executive",
    "sales_agent",
    "sales_manager",
    "regional_manager",
    "business_development_head",
    "super_admin",
    "admin",
  ]),
  claimSeClient,
);
authRoute.get("/manager-team-details/:id", authMiddleware, requirePermission("team:view", ["regional_manager", "sales_manager"]), getManagerTeamDetails);
authRoute.post(
  "/:id/profile/phone/request-otp",
  authMiddleware,
  requireAdminOrSuperAdmin,
  requestAdminUserPhoneChangeOtp
);
authRoute.patch(
  "/:id/profile",
  authMiddleware,
  requireAdminOrSuperAdmin,
  updateUserProfileById
);
 
authRoute.get("/all-users", authMiddleware, requirePermission("user:view"), getAllUsers);

authRoute.patch(
  "/:id/follow-up-work-status",
  authMiddleware,
  requirePermission("user:view"),
  updateFollowUpWorkStatus,
);

authRoute.get(
  "/:id/working-locations",
  authMiddleware,
  getUserWorkingLocations,
);
authRoute.put(
  "/:id/working-locations",
  authMiddleware,
  updateUserWorkingLocations,
);

authRoute.patch("/:id/role", authMiddleware, requireRoleTransferAccess,
  updateUserRole
);

authRoute.patch(
  "/:id/status",
  authMiddleware,
  superAdminOnly,
  requirePermission("user:activate", ["super_admin"]),
  adminSetUserActive,
);

authRoute.delete(
  "/:id",
  authMiddleware,
  superAdminOnly,
  requirePermission("user:delete", ["super_admin"]),
  adminDeleteUser,
);

export default authRoute;
