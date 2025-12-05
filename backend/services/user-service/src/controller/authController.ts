import User from "../models/userModel";
import Role from "../models/roleModel";           
import { genOtp } from "../utils/genOtp";
import { saveOtpToRedis, verifyAndConsumeOtp } from "../utils/saveOtpRedis";
import { sendOtpEmail, sendWelcomeEmail } from "../utils/email";
import { generateToken } from "../utils/jwt";
import { Request, Response } from "express";
import { AuthRequest } from "../middlewares/authMiddleware";

export const requestOTP = async (req: Request, res: Response) => {
  try {
    const name = req.body.name;
    if (!name) return res.status(400).json({ message: "name is required" });

    const email = req.body.email?.trim()?.toLowerCase();
    if (!email) return res.status(400).json({ message: "Email is required" });

    const otp = genOtp();

    await saveOtpToRedis(email, otp);
    await sendOtpEmail(email, otp, name);

    res.status(200).json({ message: "OTP sent successfully" });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Failed to send OTP", error: error.message });
  }
};

export const verifyOtp = async (req: Request, res: Response) => {
  try {
    const email = req.body.email?.trim()?.toLowerCase();
    const otp = req.body.otp?.trim();
    const name = req.body.name;

    if (!email) return res.status(400).json({ message: "Email is required" });
    if (!otp) return res.status(400).json({ message: "OTP is required" });
    if (!name) return res.status(400).json({ message: "Name is required" });

    const isValid = await verifyAndConsumeOtp(email, otp);
    if (!isValid)
      return res.status(400).json({ message: "Invalid or expired OTP" });

    let createdNewUser = false;

    let user = await User.findOne({ email });

    if (!user) {
      // 1️⃣ find default "user" role
      const defaultRole = await Role.findOne({ name: "user" });


      if (!defaultRole) {
        return res
          .status(500)
          .json({ message: "Default role 'user' not found. Seed roles first." });
      }

      // 2️⃣ create user with roleId pointing to Role document
      user = await User.create({
        name,
        email,
        roleId: defaultRole._id,
      } as any);

      createdNewUser = true;
    } else {
      if (!user.name && name){ user.name = name; }
 
      
    }

    // 3️⃣ populate roleId so we get the role document
    await user.populate("roleId");
    const role: any = user.roleId;

    // 4️⃣ build JWT payload with role + permissions
    const token = generateToken({
      sub: String(user._id),
      email,
      name: user.name, 
      roleId: role ? String(role._id) : undefined,
      roleName: role ? role.name : undefined,
      permissions: role ? role.permissions : [],
    });

    await user.save();

    if (createdNewUser) {
      sendWelcomeEmail(email, name).catch((err) =>
        console.error("Welcome email failed:", err?.message || err)
      );
    }

    return res
      .status(200)
      .json({ message: "OTP verified successfully", token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to verify OTP" });
  }
};

export const me = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const authHeader = req.headers.authorization;
    const token = authHeader?.split(" ")[1] || null;


    const user = await User.findById(req.user.sub).populate("roleId");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const role: any = user.roleId;

    return res.json({
      message: "Authenticated user",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        roleId: role ? String(role._id) : null,
        roleName: role ? role.name : null,
        permissions: role ? role.permissions : [],
      },
    });
  } catch (err: any) {
    console.error("Error in /me:", err);
    return res.status(500).json({ message: "Failed to load user profile" });
  }
};

export const updateUserRole = async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;
    const { roleName } = req.body; // e.g. "admin", "sales_manager"

    if (!roleName) {
      return res.status(400).json({ message: "roleName is required" });
    }

    const role = await Role.findOne({ name: roleName });
    if (!role) {
      return res.status(400).json({ message: `Role '${roleName}' not found` });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { roleId: role._id },
      { new: true }
    ).populate("roleId");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "User role updated",
      user,
    });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ message: "Failed to update user role", error: err.message });
  }
};

export const getAllUsers = async (_req: Request, res: Response) => {
  try {
    const users = await User.find().select("-token");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch users" });
  }
};

export const searchUsers = async (req: Request, res: Response) => {
  try {
    const query = req.query.q?.toString().trim();

    if (!query) {
      return res.status(400).json({ message: "Search query 'q' is required" });
    }

    // Text search + fallback regex
    const users = await User.find({
      $or: [
        { name: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
        { phone: { $regex: query, $options: "i" } }
      ]
    })
      .populate("roleId")
      .select("name email phone roleId");

    return res.json({ results: users, count: users.length });
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ message:" Search failed" });
  }
};