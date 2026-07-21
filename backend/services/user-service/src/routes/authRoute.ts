import express from "express";
import { adminCreateRequestOtp, adminCreateUpdateLocation, adminCreateVerifyOtp, assignManager, createRequestOtp,  createVerifyOtp, deleteMyAccount, getAllUsers,  getManagerTeamDetails, me, requestAdminUserPhoneChangeOtp, requestOTP, searchUsers, updateLocationOtp, updateUser, updateUserProfileById, updateUserRole, verifyOtp } from "../controller/authController";
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
  if (!req.user || !["super_admin", "admin", "regional_manager"].includes(req.user.roleName || "")) {
    return res.status(403).json({ message: "Forbidden: role transfer access denied" });
  }

  next();
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

authRoute.patch("/:id/role", authMiddleware, requireRoleTransferAccess,
  updateUserRole
);

export default authRoute;
