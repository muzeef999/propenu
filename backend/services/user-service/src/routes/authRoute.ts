// routes/auth.js
import express from "express";
import { requestOTP, verifyOtp } from "../controller/authController";

const authRoute = express.Router();

authRoute.post("/request-otp",  requestOTP);

authRoute.post("/verify-otp",  verifyOtp);

export default authRoute;
