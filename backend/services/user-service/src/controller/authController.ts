import User from "../models/userModel";
import Role from "../models/roleModel";
import { genOtp } from "../utils/genOtp";
import { saveOtpToRedis, verifyAndConsumeOtp } from "../utils/saveOtpRedis";
import { generateToken } from "../utils/jwt";
import { Request, Response } from "express";
import { AuthRequest } from "../middlewares/authMiddleware";
import { sendOtpWhatsApp } from "../utils/whatsapp";
import { sendOtpEmail } from "../utils/email";
import { getOtpLoginRestrictionMessage, requiresKycForLogin } from "../utils/accessPolicy";
import mongoose from "mongoose";
import DeletedAccount from "../models/deletedAccountModel";

const deletedAccountMessage =
  "This account has been deleted. Please create a new account.";
const ADMIN_CREATE_ROLES = new Set([
  "admin",
  "super_admin",
  "sales_manager",
  "sales_agent",
  "accounts",
  "customer_care",
]);

const getDummyLoginConfig = () => ({
  phone: process.env.DUMMY_LOGIN_PHONE?.trim(),
  otp: process.env.DUMMY_LOGIN_OTP?.trim(),
});

const normalizePhoneDigits = (phone?: string) => phone?.replace(/\D/g, "");

const isDummyLoginPhone = (phone?: string) => {
  const { phone: dummyPhone } = getDummyLoginConfig();
  const inputDigits = normalizePhoneDigits(phone);
  const dummyDigits = normalizePhoneDigits(dummyPhone);

  if (!phone || !dummyPhone || !inputDigits || !dummyDigits) {
    return false;
  }

  return (
    phone.trim() === dummyPhone ||
    inputDigits === dummyDigits ||
    inputDigits === `91${dummyDigits}` ||
    inputDigits.endsWith(dummyDigits)
  );
};

const findDeletedAccount = async ({
  email,
  phone,
}: {
  email?: string;
  phone?: string;
}) => {
  const lookup = [
    ...(email ? [{ email }] : []),
    ...(phone ? [{ phone }] : []),
  ];

  if (!lookup.length) {
    return null;
  }

  return DeletedAccount.findOne({ $or: lookup }).select("_id").lean();
};

const createAuthToken = ({
  user,
  roleDoc,
}: {
  user: any;
  roleDoc?: any;
}) => {
  const payload: any = {
    sub: String(user._id),
    email: user.email,
    name: user.name,
    roleId: roleDoc ? String(roleDoc._id) : undefined,
    roleName: roleDoc?.name,
    permissions: roleDoc?.permissions ?? [],
    accountStatus: user.accountStatus,
  };

  if (user.phone) {
    payload.phone = Number(user.phone);
  }

  return generateToken(payload);
};

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
      $or: [...(email ? [{ email }] : []), ...(phone ? [{ phone }] : [])],
    }).select("_id name email phone accountStatus roleId isActive");

    if (!existingUser) {
      const deletedAccount = await findDeletedAccount({ email, phone });

      if (deletedAccount) {
        return res.status(403).json({
          message: deletedAccountMessage,
        });
      }

      return res.status(404).json({
        message: "Account not registered. Please sign up first.",
      });
    }

    if (existingUser.isActive === false) {
      return res.status(403).json({
        message: deletedAccountMessage,
      });
    }

    const role = existingUser.roleId
      ? await Role.findById(existingUser.roleId).select("name").lean()
      : null;

    if (
      requiresKycForLogin(role?.name) &&
      existingUser.accountStatus !== "active"
    ) {
      return res.status(403).json({
        message: "Please complete the KYC process",
      });
    }

    const restrictionMessage = getOtpLoginRestrictionMessage({
      roleName: role?.name,
      email,
      phone,
    });

    if (restrictionMessage) {
      return res.status(403).json({
        message: restrictionMessage,
      });
    }

    if (isDummyLoginPhone(phone)) {
      return res.status(200).json({ message: "OTP sent successfully" });
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

    if (!email && !phone) {
      return res.status(400).json({
        message: "Either email or phone is required",
      });
    }

    if (!otp) {
      return res.status(400).json({ message: "OTP is required" });
    }

    const user = await User.findOne({
      $or: [...(email ? [{ email }] : []), ...(phone ? [{ phone }] : [])],
    }).populate("roleId");

    if (!user) {
      const deletedAccount = await findDeletedAccount({ email, phone });

      if (deletedAccount) {
        return res.status(403).json({
          message: deletedAccountMessage,
        });
      }

      return res.status(404).json({
        message: "Account not found",
      });
    }

    if (user.isActive === false) {
      return res.status(403).json({
        message: deletedAccountMessage,
      });
    }

    const role: any = user.roleId;

    const restrictionMessage = getOtpLoginRestrictionMessage({
      roleName: role?.name,
      email,
      phone,
    });

    if (restrictionMessage) {
      return res.status(403).json({
        message: restrictionMessage,
      });
    }

    const key = email || phone;
    const { otp: dummyOtp } = getDummyLoginConfig();
    const isValid =
      isDummyLoginPhone(phone) && dummyOtp
        ? otp === dummyOtp
        : await verifyAndConsumeOtp(key, otp);

    if (!isValid) {
      return res.status(400).json({
        message: "Invalid or expired OTP",
      });
    }

    /* ⭐ Roles that require KYC */
    const KYC_REQUIRED_ROLES = ["user", "agent"];

    if (KYC_REQUIRED_ROLES.includes(role?.name)) {
      if (user.accountStatus !== "active") {
        return res.status(403).json({
          message: "Please complete KYC verification",
          kycStatus: user.kyc?.status || "not_started",
        });
      }
    }

    const token = generateToken({
      sub: String(user._id),
      email: user.email,
      phone: Number(user.phone),
      name: user.name,
      roleId: role ? String(role._id) : undefined,
      roleName: role ? role.name : undefined,
      permissions: role ? role.permissions : [],
      accountStatus: user.accountStatus,
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
    // 1️⃣ check authentication
    if (!req.user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const authHeader = req.headers.authorization;
    const token = authHeader?.split(" ")[1] || null;

    // 2️⃣ load user
    const user = await User.findById(req.user.sub).populate("roleId").lean();

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (user.isActive === false) {
      return res.status(403).json({
        message: "Account is no longer active",
      });
    }

    const role: any = user.roleId;

    // 3️⃣ detect location completion
    const locationCompleted =
      !!user.locality && !!user.city && !!user.state && !!user.pincode;

    // 4️⃣ detect KYC status
    const kycStatus = user.kyc?.status || "not_started";

    return res.status(200).json({
      message: "Authenticated user",
      token,

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        accountStatus: user.accountStatus,
        locality: user.locality,
        city: user.city,
        state: user.state,
        pincode: user.pincode,
        locationCompleted,
        phoneVerified: user.phoneVerified,
        roleId: role ? String(role._id) : null,
        roleName: role ? role.name : null,
        permissions: role ? role.permissions : [],

        kyc: {
          status: kycStatus,
        },
      },
    });
  } catch (err: any) {
    return res.status(500).json({
      message: "Failed to load user profile",
    });
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

export const deleteMyAccount = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.sub) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { reason, feedback } = req.body as {
      reason?: string;
      feedback?: string;
    };

    const user = await User.findById(req.user.sub).select(
      "_id name email phone roleId isActive"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isActive === false) {
      return res.status(400).json({ message: "Account is already deleted" });
    }

    await DeletedAccount.create({
      userId: user._id,
      name: user.name,
      email: user.email ?? null,
      phone: user.phone ?? null,
      roleId: user.roleId ?? null,
      deletedAt: new Date(),
      deletionReason: reason?.trim() || null,
      deletionFeedback: feedback?.trim() || null,
    });

    await User.findByIdAndDelete(user._id);

    return res.status(200).json({
      message: "Your account has been deleted successfully",
    });
  } catch (error: any) {
    console.error("deleteMyAccount error", error);
    return res.status(500).json({
      message: "Failed to delete account",
      error: error.message,
    });
  }
};

export const getAllUsers = async (_req: Request, res: Response) => {
  try {
    const users = await User.find()
      .select("-token")
      .populate("roleId", "name")
      .lean();

    const formattedUsers = users.map((user: any) => {
      const role = user.roleId;

      return {
        ...user,
        roleId: role?._id ? String(role._id) : user.roleId ? String(user.roleId) : null,
        roleName: role?.name || null,
      };
    });

    res.json(formattedUsers);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch users" });
  }
};

export const searchUsers = async (req: Request, res: Response) => {
  try {
    const query = req.query.q?.toString().trim();
    const roleFilter = req.query.role?.toString().trim();

    if (!query && !roleFilter) {
      return res.status(400).json({
        message: "Search query 'q' or role is required",
      });
    }

    const match: any = {};

    if (query) {
      match.$or = [
        { name: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
        { phone: { $regex: query, $options: "i" } },
        { locality : { $regex: query, $options: "i"}},
        { city :{ $regex: query, $options: "i"}},
        { state :{ $regex: query, $options: "i"}},
        { pincode:{ $regex: query, $options: "i"}},
      ];
    }

    const pipeline: any[] = [
      {
        $lookup: {
          from: "roles",
          localField: "roleId",
          foreignField: "_id",
          as: "role",
        },
      },
      { $unwind: "$role" },

      {
        $lookup: {
          from: "agents",
          localField: "_id",
          foreignField: "user",
          as: "agent",
        },
      },
      {
        $unwind: {
          path: "$agent",
          preserveNullAndEmptyArrays: true
        }
      }
    ];

    if (roleFilter) {
      pipeline.push({
        $match: { "role.name": roleFilter }
      });
    }

    if (query) {
      pipeline.push({ $match: match });
    }

    pipeline.push({
      $project: {
        _id: {
          $cond: [
            { $eq: ["$role.name", "agent"] },
            { $ifNull: ["$agent._id", "$_id"] },
            "$_id",
          ],
        },

        userId: "$_id",

        agentId: {
          $cond: [
            { $eq: ["$role.name", "agent"] },
            "$agent._id",
            "$$REMOVE",
          ],
        },

        name: 1,
        email: 1,
        phone: 1,
        locality: 1,
        city: 1,
        state: 1,
        pincode: 1,

        role: "$role.name",

        verificationStatus: {
          $cond: [
            { $eq: ["$role.name", "agent"] },
            "$agent.verificationStatus",
            "$$REMOVE",
          ],
        },

        agentDetails: {
          $cond: [
            { $eq: ["$role.name", "agent"] },
            {
              _id: "$agent._id",
              slug: "$agent.slug",
              name: "$agent.name",
              bio: "$agent.bio",
              agencyName: "$agent.agencyName",
              licenseNumber: "$agent.licenseNumber",
              licenseValidTill: "$agent.licenseValidTill",
              areasServed: "$agent.areasServed",
              city: "$agent.city",
              experienceYears: "$agent.experienceYears",
              dealsClosed: "$agent.dealsClosed",
              languages: "$agent.languages",
              verificationStatus: "$agent.verificationStatus",
              avatar: "$agent.avatar",
              coverImage: "$agent.coverImage",
              rera: "$agent.rera",
              stats: "$agent.stats",
              createdAt: "$agent.createdAt",
              updatedAt: "$agent.updatedAt",
            },
            "$$REMOVE",
          ],
        },
      },
    });

    const users = await User.aggregate(pipeline);

    res.json({
      results: users,
      count: users.length
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Search failed" });
  }
};

export const createRequestOtp = async (req: Request, res: Response) => {
  try {
    let { phone, email } = req.body;
    phone = phone?.trim();
    email = email?.trim()?.toLowerCase();

    // Validate phone
    if (!phone && !email) {
      return res.status(400).json({
        message: "Either phone or email is required",
      });
    }

    const otp = genOtp();
    
    const key = phone || email;

    if (isDummyLoginPhone(phone)) {
      return res.status(200).json({
        message: "OTP sent successfully",
      });
    }

    await saveOtpToRedis(key, otp);

   if (phone) {
      await sendOtpWhatsApp(phone, otp);
    } else if (email) {
      await sendOtpEmail(email, otp); // 👈 you need to implement this
    }
    
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
    let { email, phone, otp, name, role } = req.body;

    email = email?.trim()?.toLowerCase();
    phone = phone?.trim();
    otp = otp?.trim();

    if (!phone) {
      return res.status(400).json({
        message: "Phone number is required",
      });
    }

    if (!otp) {
      return res.status(400).json({
        message: "OTP is required",
      });
    }

    // verify OTP
    const { otp: dummyOtp } = getDummyLoginConfig();
    const isValid =
      isDummyLoginPhone(phone) && dummyOtp
        ? otp === dummyOtp
        : await verifyAndConsumeOtp(phone, otp);

    if (!isValid) {
      return res.status(400).json({
        message: "Invalid or expired OTP",
      });
    }

    let user = await User.findOne({ phone }).populate("roleId");

    // USER EXISTS
    if (user) {
      if (user.accountStatus === "active") {
        return res.status(409).json({
          message: "Account already registered. Please login.",
        });
      }

      const roleDoc: any = user.roleId;

      const token = generateToken({
        sub: String(user._id),
        email: user.email,
        phone: Number(user.phone),
        name: user.name,
        roleId: String(roleDoc._id),
        roleName: roleDoc.name,
        permissions: roleDoc.permissions,
        accountStatus: user.accountStatus,
      });

      let nextStep = "location";

      if (user.locality && user.city && user.state && user.pincode) {
        nextStep = roleDoc.name === "builder" ? "completed" : "kyc";
      }

      return res.status(200).json({
        message: "Continue signup process",
        token,
        nextStep,
        kycStatus: user.kyc?.status || "not_started",
      });
    }

    // NEW USER
    const roleDoc = await Role.findOne({
      name: role.toLowerCase(),
    });

    if (!roleDoc) {
      return res.status(400).json({
        message: "Invalid role",
      });
    }

    user = await User.create({
      name,
      email: email || undefined,
      phone,
      roleId: roleDoc._id,
      phoneVerified: true,
      accountStatus: "location_pending",
      kyc: {
        status: "not_started",
      },
    });

    const token = generateToken({
      sub: String(user._id),
      email: user.email,
      phone: Number(user.phone),
      name: user.name,
      roleId: String(roleDoc._id),
      roleName: roleDoc.name,
      permissions: roleDoc.permissions,
      accountStatus: user.accountStatus,
    });

    return res.status(201).json({
      message: "Account created. Continue signup.",
      token,
      nextStep: "location",
      kycStatus: "not_started",
    });
  } catch (error: any) {
    return res.status(500).json({
      message: "Signup failed",
      error: error.message,
    });
  }
};

export const adminCreateRequestOtp = async (req: Request, res: Response) => {
  try {
    let { email } = req.body;
    email = email?.trim()?.toLowerCase();

    if (!email) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    const existingUser = await User.findOne({ email })
      .select("_id email accountStatus isActive")
      .lean();

    if (existingUser?.isActive === false) {
      return res.status(403).json({
        message: deletedAccountMessage,
      });
    }

    if (existingUser?.accountStatus === "active") {
      return res.status(409).json({
        message: "Account already registered. Please login.",
      });
    }

    const deletedAccount = await findDeletedAccount({ email });
    if (deletedAccount) {
      return res.status(403).json({
        message: deletedAccountMessage,
      });
    }

    const otp = genOtp();
    await saveOtpToRedis(email, otp);
    await sendOtpEmail(email, otp);

    return res.status(200).json({
      message: "OTP sent successfully",
    });
  } catch (error: any) {
    return res.status(500).json({
      message: "Failed to send OTP",
      error: error.message,
    });
  }
};

export const adminCreateVerifyOtp = async (req: Request, res: Response) => {
  try {
    let { email, otp, name, role } = req.body;

    email = email?.trim()?.toLowerCase();
    otp = otp?.trim();
    name = name?.trim();
    role = role?.trim()?.toLowerCase();

    if (!email) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    if (!otp) {
      return res.status(400).json({
        message: "OTP is required",
      });
    }

    const isValid = await verifyAndConsumeOtp(email, otp);

    if (!isValid) {
      return res.status(400).json({
        message: "Invalid or expired OTP",
      });
    }

    let user = await User.findOne({ email }).populate("roleId");

    if (user) {
      if (user.isActive === false) {
        return res.status(403).json({
          message: deletedAccountMessage,
        });
      }

      const roleDoc: any = user.roleId;
      const token = createAuthToken({ user, roleDoc });

      let nextStep = "location";
      if (user.locality && user.city && user.state && user.pincode) {
        nextStep = "completed";
      }

      return res.status(200).json({
        message:
          user.accountStatus === "active"
            ? "Account already registered. Please login."
            : "Continue signup process",
        token,
        nextStep,
      });
    }

    if (!name) {
      return res.status(400).json({
        message: "Name is required",
      });
    }

    if (!role || !ADMIN_CREATE_ROLES.has(role)) {
      return res.status(400).json({
        message: "Invalid admin role",
      });
    }

    const roleDoc = await Role.findOne({ name: role });

    if (!roleDoc) {
      return res.status(400).json({
        message: "Invalid role",
      });
    }

    user = await User.create({
      name,
      email,
      roleId: roleDoc._id,
      accountStatus: "location_pending",
      kyc: {
        status: "not_started",
      },
    });

    const token = createAuthToken({ user, roleDoc });

    return res.status(201).json({
      message: "Account created. Continue signup.",
      token,
      nextStep: "location",
    });
  } catch (error: any) {
    return res.status(500).json({
      message: "Admin signup failed",
      error: error.message,
    });
  }
};

export const adminCreateUpdateLocation = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    let { locality, city, state, pincode } = req.body;

    if (!locality || !city || !state || !pincode) {
      return res.status(400).json({
        message: "All location fields are required",
      });
    }

    const user = await User.findById(req.user.sub).populate("roleId");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const roleDoc: any = user.roleId;
    if (!ADMIN_CREATE_ROLES.has(roleDoc?.name || "")) {
      return res.status(403).json({
        message: "This endpoint is only allowed for admin-created roles",
      });
    }

    user.locality = locality.trim();
    user.city = city.trim();
    user.state = state.trim();
    user.pincode = pincode.trim();
    user.accountStatus = "active";

    await user.save();

    const token = createAuthToken({ user, roleDoc });

    return res.status(200).json({
      message: "Location updated successfully. Account is now active.",
      token,
      user,
    });
  } catch (error: any) {
    return res.status(500).json({
      message: "Failed to update location",
      error: error.message,
    });
  }
};

export const updateLocationOtp = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    let { locality, city, state, pincode } = req.body;

    if (!locality || !city || !state || !pincode) {
      return res.status(400).json({
        message: "All location fields are required",
      });
    }

    const updatedUser = await User.findById(req.user.sub);

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    updatedUser.locality = locality.trim();
    updatedUser.city = city.trim();
    updatedUser.state = state.trim();
    updatedUser.pincode = pincode.trim();

    const populatedUser = await updatedUser.populate("roleId");
    const roleName =
      typeof populatedUser.roleId === "object" &&
      populatedUser.roleId &&
      "name" in populatedUser.roleId
        ? populatedUser.roleId.name
        : undefined;

    updatedUser.accountStatus = roleName === "builder" ? "active" : "kyc_pending";

    await updatedUser.save();

    const roleDoc: any = updatedUser.roleId;
    const token = generateToken({
      sub: String(updatedUser._id),
      email: updatedUser.email,
      phone: Number(updatedUser.phone),
      name: updatedUser.name,
      roleId: roleDoc ? String(roleDoc._id) : undefined,
      roleName: roleDoc?.name,
      permissions: roleDoc?.permissions ?? [],
      accountStatus: updatedUser.accountStatus,
    });

    return res.status(200).json({
      message:
        roleName === "builder"
          ? "Location updated successfully. Builder account is now active."
          : "Location updated successfully",
      token,
      user: updatedUser,
    });
  } catch (error: any) {
    res.status(500).json({
      message: "Failed to update location",
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
    const allowedUpdates = [
      "name",
      "email",
      "address",
      "locality",
      "city",
      "state",
      "pincode",
    ];
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

    const user = await User.findById(req.user.sub).populate("roleId");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    Object.assign(user, updates);
    await user.save();

    const role: any = user.roleId;

    return res.json({
      message: "Profile updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        locality: user.locality,
        city: user.city,
        state: user.state,
        pincode: user.pincode,
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
