import User from "../models/userModel";
import Role from "../models/roleModel";
import { genOtp } from "../utils/genOtp";
import { saveOtpToRedis, verifyAndConsumeOtp } from "../utils/saveOtpRedis";
import { sendOtpEmail, sendWelcomeEmail } from "../utils/email";
import { generateToken } from "../utils/jwt";
import { Request, Response } from "express";
import { AuthRequest } from "../middlewares/authMiddleware";
import { sendOtpWhatsApp } from "../utils/whatsapp";

export const requestOTP = async (req: Request, res: Response) => {
  try {
    const phone = req.body.phone?.trim();
    if (!phone) return res.status(400).json({ message: "phone is required" });

    const existingUser = await User.findOne({ phone }).select("_id name");

    if (!existingUser) {
      return res.status(404).json({
        message: "Phone number not registered. Please sign up first.",
      });
    }

    const otp = genOtp();
    await saveOtpToRedis(phone, otp);
    await sendOtpWhatsApp(phone, otp);
    res.status(200).json({ message: "OTP sent successfully" });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Failed to send OTP", error: error.message });
  }
};

export const verifyOtp = async (req: Request, res: Response) => {
  try {
    const phone = req.body.phone?.trim()?.toLowerCase();
    const otp = req.body.otp?.trim();

    if (!phone) return res.status(400).json({ message: "phone is required" });
    if (!otp) return res.status(400).json({ message: "OTP is required" });

    const isValid = await verifyAndConsumeOtp(phone, otp);

    if (!isValid)
      return res.status(400).json({ message: "Invalid or expired OTP" });

    let user = await User.findOne({ phone }).populate("roleId");

    if (!user) {
      return res.status(403).json({
        message: "Account not found. Please contact admin.",
      });
    }

    const role: any = user.roleId;

    // 4️⃣ build JWT payload with role + permissions
    const token = generateToken({
      sub: String(user._id),
      phone: Number(user.phone),
      name: user.name,
      roleId: role ? String(role._id) : undefined,
      roleName: role ? role.name : undefined,
      permissions: role ? role.permissions : [],
    });

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
        address: user.address,
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
      { new: true },
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
    res
      .status(500)
      .json({ message: "Failed to update user role", error: err.message });
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
        { phone: { $regex: query, $options: "i" } },
      ],
    })
      .populate("roleId")
      .select("name email phone roleId");

    return res.json({ results: users, count: users.length });
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ message: " Search failed" });
  }
};

export const createRequestOtp = async (req: Request, res: Response) => {
  try {
    const { name, phone, role } = req.body;

    if (!name) return res.status(400).json({ message: "name is required" });
    if (!phone) return res.status(400).json({ message: "Phone is required" });
    if (!role) return res.status(400).json({ message: "Role is required" });

    const normalizedEmail = phone.trim().toLowerCase();

    const existingUser = await User.findOne({ phone: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({
        message: "Account already exists. Please login instead.",
      });
    }

    const roleDoc = await Role.findOne({ name: role.toLowerCase() });
    if (!roleDoc) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const otp = genOtp();

    await saveOtpToRedis(normalizedEmail, otp);
    await sendOtpWhatsApp(normalizedEmail, otp);

    res.status(200).json({ message: "OTP sent successfully" });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Failed to send OTP", error: error.message });
  }
};

export const updateUser = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // ✅ Allow only safe fields
    const allowedUpdates = ["name", "email", "address"];
    const updates: any = {};

    for (const key of allowedUpdates) {
      if (req.body[key] !== undefined) {
        updates[key] =
          typeof req.body[key] === "string"
            ? req.body[key].trim()
            : req.body[key];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "No valid fields to update" });
    }

    const user = await User.findByIdAndUpdate(
      req.user.sub,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate("roleId");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const role: any = user.roleId;

    return res.json({
      message: "Profile updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address, // ✅ RETURN IT
        roleId: role ? String(role._id) : null,
        roleName: role ? role.name : null,
        permissions: role ? role.permissions : [],
      },
    });
  } catch (error: any) {
    console.error("Update profile error:", error);
    return res.status(500).json({ message: "Failed to update profile" });
  }
};


export const createVeifytOtp = async (req: Request, res: Response) => {
  try {
    const { phone, otp, name, role } = req.body;

    if (!phone) return res.status(400).json({ message: "Email is required" });
    if (!otp) return res.status(400).json({ message: "OTP is required" });
    if (!name) return res.status(400).json({ message: "Name is required" });
    if (!role) return res.status(400).json({ message: "Role is required" });

    const normalizedEmail = phone.trim().toLowerCase();

    const isValid = await verifyAndConsumeOtp(normalizedEmail, otp);

    if (!isValid)
      return res.status(400).json({ message: "Invalid or expired OTP" });

    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res
        .status(409)
        .json({ message: "Account  already exists. please login." });
    }

    const roleDoc = await Role.findOne({ name: role.toLowerCase() });
    if (!roleDoc) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const user = await User.create({
      name,
      phone: normalizedEmail,
      roleId: roleDoc._id,
    });

    const token = generateToken({
      sub: String(user._id),
      phone,
      name: user.name,
      roleId: String(roleDoc._id),
      roleName: roleDoc.name,
      permissions: roleDoc.permissions,
    });

    // sendWelcomeEmail(email, user.name).catch(() => {});

    return res
      .status(201)
      .json({ message: "Account created successfully", token });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Failed to send OTP", error: error.message });
  }
};
