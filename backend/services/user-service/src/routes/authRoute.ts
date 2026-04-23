import express from "express";
import { assignManager, createRequestOtp,  createVerifyOtp, deleteMyAccount, getAllUsers,  getManagerTeamDetails, me, requestOTP, searchUsers, updateLocationOtp, updateUser, updateUserRole, verifyOtp } from "../controller/authController";
import { authMiddleware, AuthRequest } from "../middlewares/authMiddleware";


const authRoute = express.Router();

authRoute.post("/request-otp",  requestOTP);
authRoute.post("/verify-otp",  verifyOtp);

authRoute.post("/request-otp/create",  createRequestOtp);

authRoute.post("/verify-otp/create",  createVerifyOtp);

authRoute.post("/update-location/create", authMiddleware, updateLocationOtp);



authRoute.get("/me", authMiddleware, me);
authRoute.patch("/me/update", authMiddleware, updateUser);
authRoute.delete("/me", authMiddleware, deleteMyAccount);
authRoute.get("/search", authMiddleware, searchUsers);
authRoute.post("/assign-manager", assignManager);
authRoute.get("/manager-team-details/:id", getManagerTeamDetails);



 
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
