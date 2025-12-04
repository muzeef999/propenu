// routes/auth.js
import express from "express";
import {  getAllUsers, requestOTP, updateUserRole, verifyOtp } from "../controller/authController";
import { authMiddleware, AuthRequest } from "../middlewares/authMiddleware";
import { requireRole } from "../middlewares/requireRole";

const authRoute = express.Router();

authRoute.post("/request-otp",  requestOTP);

authRoute.post("/verify-otp",  verifyOtp);


authRoute.get('/', authMiddleware, getAllUsers)


authRoute.patch("/:id/role",
  authMiddleware,
  (req: AuthRequest, res, next) => {
    // simple check: only super_admin or admin can change roles
    if (!req.user || !["super_admin", "admin"].includes(req.user.roleName || "")) {
      return res.status(403).json({ message: "Forbidden: only admin/super_admin can change roles" });
    }
    next();
  },
  updateUserRole
);





export default authRoute;
