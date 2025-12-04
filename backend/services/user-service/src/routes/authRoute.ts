// routes/auth.js
import express from "express";
import {  getAllUsers, me, requestOTP, searchUsers, updateUserRole, verifyOtp } from "../controller/authController";
import { authMiddleware, AuthRequest } from "../middlewares/authMiddleware";

const authRoute = express.Router();

authRoute.post("/request-otp",  requestOTP);

authRoute.post("/verify-otp",  verifyOtp);

authRoute.get("/me", authMiddleware, me);

authRoute.get("/search", authMiddleware, searchUsers);
 
authRoute.get('/all-users', authMiddleware,  (req : AuthRequest, res, next) => {
    if(!req.user || !["super_admin", "admin"].includes(req.user.roleName || "")){
       return res.status(403).json({message:"Forbidden only admin/super_admin can see the users"});
    }
    next();
},  getAllUsers);

authRoute.patch("/:id/role", authMiddleware,  (req: AuthRequest, res, next) => {
    if (!req.user || !["super_admin", "admin"].includes(req.user.roleName || "")) {
      return res.status(403).json({ message: "Forbidden: only admin/super_admin can change roles" });
    }
    next();
  },
  updateUserRole
);





export default authRoute;
