import User from "../models/userModel";
import Role from "../models/roleModel";
import { genOtp } from "../utils/genOtp";
import { saveOtpToRedis, verifyAndConsumeOtp } from "../utils/saveOtpRedis";
import { generateToken } from "../utils/jwt";
import { Request, Response } from "express";
import { AuthRequest } from "../middlewares/authMiddleware";
import { sendOtpWhatsApp } from "../utils/whatsapp";
import { sendOtpEmail } from "../utils/email";
import mongoose from "mongoose";

export const requestOTP = async (req: Request, res: Response) => {
  try {
    let { email, phone } = req.body;

    email = email?.trim()?.toLowerCase();
    phone = phone?.trim();

    // ⭐ Either email OR phone required
    if (!email && !phone) {
      return res.status(400).json({
        message: "Either email or phone is required",
      });
    }

    // ⭐ Find user
    const existingUser = await User.findOne({
      $or: [
        ...(email ? [{ email }] : []),
        ...(phone ? [{ phone }] : []),
      ],
    }).select("_id name email phone");

    if (!existingUser) {
      return res.status(404).json({
        message: "Account not registered. Please sign up first.",
      });
    }

    const otp = genOtp();

    const key = email || phone;
    await saveOtpToRedis(key, otp);

    // ⭐ Send OTP based on input
    if (email) {
      await sendOtpEmail(email, otp);
    } else if (phone) {
      await sendOtpWhatsApp(phone, otp);
    }

    res.status(200).json({ message: "OTP sent successfully" });

  } catch (error: any) {
    console.error(error);
    res.status(500).json({
      message: "Failed to send OTP",
      error: error.message,
    });
  }
};

export const verifyOtp = async (req: Request, res: Response) => {
  try {
    let { email, phone, otp } = req.body;

    email = email?.trim()?.toLowerCase();
    phone = phone?.trim();
    otp = otp?.trim();

    // ⭐ Either email OR phone required
    if (!email && !phone) {
      return res.status(400).json({
        message: "Either email or phone is required",
      });
    }

    if (!otp) {
      return res.status(400).json({ message: "OTP is required" });
    }

    // ⭐ Same key used in requestOTP
    const key = email || phone;

    const isValid = await verifyAndConsumeOtp(key, otp);

    if (!isValid) {
      return res.status(400).json({
        message: "Invalid or expired OTP",
      });
    }

    // ⭐ Find user
    const user = await User.findOne({
      $or: [
        ...(email ? [{ email }] : []),
        ...(phone ? [{ phone }] : []),
      ],
    }).populate("roleId");


    
    if (!user) {
      return res.status(404).json({
        message: "Account not found",
      });
    }

    if (user.accountStatus !== "active") {
  return res.status(403).json({
    message: "Account not active. Please complete KYC verification.",
    kycStatus: user.kyc?.status || "not_started",
  });
}


    const role: any = user.roleId;

    // ⭐ Create JWT
    const token = generateToken({
      sub: String(user._id),
      email: user.email,
      phone: Number(user.phone),
      name: user.name,
      roleId: role ? String(role._id) : undefined,
      roleName: role ? role.name : undefined,
      permissions: role ? role.permissions : [],
    });

    return res.status(200).json({
      message: "OTP verified successfully",
      token,
    });

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
        kycStatus: user.kyc?.status || "not_submitted",
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

    const users = await User.aggregate([
      {
        $lookup: {
          from: "roles",            // collection name
          localField: "roleId",
          foreignField: "_id",
          as: "role",
        },
      },
      { $unwind: "$role" },

      {
        $match: {
          $or: [
            { name: { $regex: query, $options: "i" } },
            { email: { $regex: query, $options: "i" } },
            { phone: { $regex: query, $options: "i" } },
            { "role.name": { $regex: query, $options: "i" } }, // 🔥 role search
          ],
        },
      },

      {
        $project: {
          name: 1,
          email: 1,
          phone: 1,
          role: 1,
        },
      },
    ]);

    res.json({ results: users, count: users.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Search failed" });
  }
};


export const createRequestOtp = async (req: Request, res: Response) => {
  try {

    let { phone } = req.body;
    phone = phone?.trim();

    // Validate phone
    if (!phone) {
      return res.status(400).json({
        message: "Phone number is required",
      });
    }
    const otp = genOtp();

    const key = phone;
    await saveOtpToRedis(key, otp);

    await sendOtpWhatsApp(phone, otp);

    res.status(200).json({
      message: "OTP sent successfully",
    });
  } catch (error: any) {
    res.status(500).json({
      message: "Failed to send OTP",
      error: error.message,
    });
  }
};


export const createVerifyOtp = async (req: Request, res: Response) => {
  try {
    let { email, phone, otp, name, role,  locality, city, state, pincode } = req.body;

    email = email?.trim()?.toLowerCase();
    phone = phone?.trim();
    otp = otp?.trim();

    // ⭐ Validate fields
    if (!email && !phone)
      return res.status(400).json({
        message: "Either email or phone is required",
      });

    if (!otp)
      return res.status(400).json({ message: "OTP is required" });

    if (!name)
      return res.status(400).json({ message: "Name is required" });

    if (!role)
      return res.status(400).json({ message: "Role is required" });

    // ⭐ Verify OTP
    const key = email || phone;
    const isValid = await verifyAndConsumeOtp(key, otp);

    if (!isValid)
      return res.status(400).json({
        message: "Invalid or expired OTP",
      });

    // ⭐ Check user exists
    const existingUser = await User.findOne({
      $or: [
        ...(email ? [{ email }] : []),
        ...(phone ? [{ phone }] : []),
      ],
    });

    if (existingUser) {
      return res.status(409).json({
        message: "Account already exists. Please login.",
      });
    }

    // ⭐ Find role
    const roleDoc = await Role.findOne({ name: role.toLowerCase() });

    if (!roleDoc)
      return res.status(400).json({ message: "Invalid role" });

    // ⭐ Create user
    const user = await User.create({
      name,
      email: email || undefined,
      phone: phone || undefined,
      roleId: roleDoc._id,
      phoneVerified: true,
      locality,
      city,
      state,
      pincode,
    });

    const token = generateToken({
      sub: String(user._id),
      email: user.email,
      phone: Number(user.phone),
      name: user.name,
      roleId: String(roleDoc._id),
      roleName: roleDoc.name,
      permissions: roleDoc.permissions,
    });


    return res.status(201).json({
      message: "Account created. Please complete KYC to activate account.",
      token,
        kycStatus: "not_started"
    });

  } catch (error: any) {
    res.status(500).json({
      message: "Signup failed",
      error: error.message,
    });
  }
};



export const updateUser = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // ✅ Allow only safe fields
    const allowedUpdates = ["name", "email", "address"];
    const updates: Record<string, unknown> = {};

    for (const key of allowedUpdates) {
      if (req.body[key] !== undefined) {
        if (typeof req.body[key] === "string") {
          const cleaned = req.body[key].trim();
          updates[key] = key === "email" ? cleaned.toLowerCase() : cleaned;
        } else {
          updates[key] = req.body[key];
        }
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "No valid fields to update" });
    }

    const user = await User.findByIdAndUpdate(
      req.user.sub,
      { $set: updates },
      { new: true, runValidators: true },
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

    if (error?.code === 11000 && error?.keyPattern?.email) {
      return res.status(409).json({
        message: "Email already exists. Please use a different email.",
      });
    }

    return res.status(500).json({ message: "Failed to update profile" });
  }
};


export const getManagerTeamDetails = async (req: Request, res: Response) => {
  try {
    const managerId = req.params.id;

    // ⭐ Check ID exists
    if (!managerId) {
      return res.status(400).json({ message: "managerId is required" });
    }

    // ⭐ Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(managerId)) {
      return res.status(400).json({ message: "Invalid managerId" });
    }

    // ⭐ Now safe to use
    const manager = await User.findById(managerId)
      .populate("roleId", "name")
      .select("name email phone");

    if (!manager) {
      return res.status(404).json({ message: "Manager not found" });
    }

    const role: any = manager.roleId;

    if (!role || role.name !== "sales_manager") {
      return res.status(400).json({
        message: "User is not a sales_manager",
      });
    }

    // ⭐ Get agents
    const agents = await User.find({ managerId })
      .select("name email phone")
      .lean();

    res.json({
      manager: {
        id: manager._id,
        name: manager.name,
        email: manager.email,
      },
      totalAgents: agents.length,
      agents,
    });

  } catch (err: any) {
    console.error("getManagerTeamDetails error:", err);
    res.status(500).json({ message: err.message });
  }
};



export const assignManager = async (req: Request, res: Response) => {
  try {
    const { salesagentId, managerId } = req.body;

    // ⭐ Validate input
    if (!salesagentId || !managerId) {
      return res.status(400).json({
        message: "salesagentId and managerId are required",
      });
    }

    // ⭐ Validate ObjectId
    if (
      !mongoose.Types.ObjectId.isValid(salesagentId) ||
      !mongoose.Types.ObjectId.isValid(managerId)
    ) {
      return res.status(400).json({ message: "Invalid user IDs" });
    }

    // ⭐ Get users
    const agent = await User.findById(salesagentId).populate("roleId");
    const manager = await User.findById(managerId).populate("roleId");

    if (!agent || !manager) {
      return res.status(404).json({ message: "User not found" });
    }

    const agentRole: any = agent.roleId;
    const managerRole: any = manager.roleId;

    // ⭐ Check agent role
    if (!agentRole || agentRole.name !== "sales_agent") {
      return res.status(400).json({
        message: "User must be sales_agent",
      });
    }

    // ⭐ Check manager role
    if (!managerRole || managerRole.name !== "sales_manager") {
      return res.status(400).json({
        message: "Manager must be sales_manager",
      });
    }

    // ⭐ Assign manager
    agent.managerId = manager._id;
    await agent.save();

    return res.json({
      message: "Manager assigned successfully",
      agent: {
        id: agent._id,
        name: agent.name,
      },
      manager: {
        id: manager._id,
        name: manager.name,
      },
    });

  } catch (err: any) {
    console.error("assignManager error:", err);
    res.status(500).json({ message: err.message });
  }
};


