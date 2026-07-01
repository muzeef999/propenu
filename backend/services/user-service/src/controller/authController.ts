import User from "../models/userModel";
import Role from "../models/roleModel";
import { genOtp } from "../utils/genOtp";
import {
  OtpVerificationResult,
  saveOtpToRedis,
  verifyAndConsumeOtpWithReason,
} from "../utils/saveOtpRedis";
import { generateToken } from "../utils/jwt";
import { Request, Response } from "express";
import { AuthRequest } from "../middlewares/authMiddleware";
import { sendOtpWhatsApp } from "../utils/whatsapp";
import { sendOtpEmail } from "../utils/email";
import { getOtpLoginRestrictionMessage, requiresKycForLogin } from "../utils/accessPolicy";
import mongoose from "mongoose";
import DeletedAccount from "../models/deletedAccountModel";
import Agent from "../models/agentModel";
import { getBuilderAccessForUser } from "../services/builderAccessService";

const deletedAccountMessage =
  "This account has been deleted. Please create a new account.";
const ADMIN_CREATE_ROLES = new Set([
  "admin",
  "super_admin",
  "sales_manager",
  "sales_agent",
  "accounts",
  "digital_marketing",
  "customer_care",
]);
const NAME_MAX_LENGTH = 42;
const COMPANY_NAME_MAX_LENGTH = 80;
const ADMIN_PROFILE_UPDATE_FIELDS = [
  "name",
  "companyName",
  "email",
  "phone",
  "address",
  "locality",
  "city",
  "state",
  "pincode",
] as const;

const getAdminPhoneChangeOtpKey = (
  adminId: string,
  userId: string,
  phone: string
) => `admin-phone-change:${adminId}:${userId}:${phone}`;

const validatePhoneNumber = (phone?: string) => {
  const trimmed = phone?.trim();

  if (!trimmed) {
    return "Phone number is required";
  }

  if (!/^\+?[1-9]\d{6,14}$/.test(trimmed)) {
    return "Invalid phone number";
  }

  return "";
};

const createInitialAgentProfile = async (userId: mongoose.Types.ObjectId) => {
  return Agent.findOneAndUpdate(
    { user: userId },
    {
      $setOnInsert: {
        user: userId,
        name: "",
        bio: "",
        agencyName: "",
        licenseNumber: "",
        locality: "",
        city: "",
        experienceYears: 0,
        dealsClosed: 0,
        areasServed: [],
        languages: [],
        avatar: null,
        coverImage: null,
        rera: {
          reraAgentId: "",
          isVerified: false,
        },
        stats: {
          totalProperties: 0,
          publishedCount: 0,
        },
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );
};

const getDummyLoginConfig = () => ({
  phone: process.env.DUMMY_LOGIN_PHONE?.trim(),
  otp: process.env.DUMMY_LOGIN_OTP?.trim(),
});

const normalizePhoneDigits = (phone?: string) => phone?.replace(/\D/g, "");

const getPhoneLookupValues = (phone?: string) => {
  const trimmed = phone?.trim();
  const digits = normalizePhoneDigits(trimmed);

  if (!trimmed || !digits) return [];

  const values = new Set<string>([trimmed, digits]);
  const withoutIndiaCode =
    digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : digits;

  if (withoutIndiaCode.length === 10) {
    values.add(withoutIndiaCode);
    values.add(`91${withoutIndiaCode}`);
    values.add(`+91${withoutIndiaCode}`);
  }

  return [...values];
};

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

const getOtpFailureResponse = (
  result: Extract<OtpVerificationResult, { valid: false }>
) => {
  if (result.reason === "expired") {
    return {
      message: "OTP has expired or is no longer valid. Please request a new OTP.",
      reason: "expired",
      code: "OTP_EXPIRED",
    };
  }

  return {
    message: "Incorrect OTP. Please check the code and try again.",
    reason: "incorrect",
    code: "OTP_INCORRECT",
  };
};

const validateSignupName = (name?: string) => {
  const value = name?.trim();

  if (!value) {
    return "Name is required";
  }

  if (value.length < 3) {
    return "Name must be at least 3 characters";
  }

  if (value.length > NAME_MAX_LENGTH) {
    return `Name must be ${NAME_MAX_LENGTH} characters or less`;
  }

  return "";
};

const validateCompanyName = (companyName?: string) => {
  const value = companyName?.trim();

  if (!value) {
    return "Company name is required for builders";
  }

  if (value.length > COMPANY_NAME_MAX_LENGTH) {
    return `Company name must be ${COMPANY_NAME_MAX_LENGTH} characters or less`;
  }

  return "";
};

const verifyDummyOrRedisOtp = async ({
  phone,
  key,
  otp,
}: {
  phone?: string;
  key: string;
  otp: string;
}): Promise<OtpVerificationResult> => {
  const { otp: dummyOtp } = getDummyLoginConfig();

  if (isDummyLoginPhone(phone) && dummyOtp) {
    return otp === dummyOtp
      ? { valid: true }
      : { valid: false, reason: "incorrect" };
  }

  return verifyAndConsumeOtpWithReason(key, otp);
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

const createAuthToken = async ({
  user,
  roleDoc,
}: {
  user: any;
  roleDoc?: any;
}) => {
  const builderAccess = await getBuilderAccessForUser({
    _id: user._id,
    roleName: roleDoc?.name,
  });

  const payload: any = {
    sub: String(user._id),
    email: user.email,
    name: user.name,
    companyName: user.companyName,
    roleId: roleDoc ? String(roleDoc._id) : undefined,
    roleName: roleDoc?.name,
    permissions: roleDoc?.permissions ?? [],
    builderAccess,
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
    const phoneValues = getPhoneLookupValues(phone);
    const normalizedPhone = phoneValues.find((value) => value.length === 10);
    const existingUser = await User.findOne({
      $or: [
        ...(email ? [{ email }] : []),
        ...(phoneValues.length ? [{ phone: { $in: phoneValues } }] : []),
      ],
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

    const key = email || normalizedPhone || phone;
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

    const phoneValues = getPhoneLookupValues(phone);
    const normalizedPhone = phoneValues.find((value) => value.length === 10);
    const user = await User.findOne({
      $or: [
        ...(email ? [{ email }] : []),
        ...(phoneValues.length ? [{ phone: { $in: phoneValues } }] : []),
      ],
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

    const key = email || normalizedPhone || phone;
    const otpResult = await verifyDummyOrRedisOtp({ phone, key, otp });

    if (!otpResult.valid) {
      return res.status(400).json({
        ...getOtpFailureResponse(otpResult),
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

    const token = await createAuthToken({ user, roleDoc: role });

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
    const builderAccess = await getBuilderAccessForUser({
      _id: user._id,
      roleName: role?.name,
    });

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
        companyName: user.companyName,
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
        builderAccess,

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

    if (role.name === "agent") {
      await createInitialAgentProfile(user._id);
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
        { companyName: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
        { phone: { $regex: query, $options: "i" } },
        { userCode: { $regex: query, $options: "i" } },
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
            { $ifNull: ["$agent._id", null] },
            "$$REMOVE",
          ],
        },

        name: 1,
        companyName: 1,
        email: 1,
        phone: 1,
        userCode: 1,
        locality: 1,
        city: 1,
        state: 1,
        pincode: 1,
        createdAt: 1,

        role: "$role.name",

        kycStatus: { $ifNull: ["$kyc.status", "not_started"] },
        kycReason: { $ifNull: ["$kyc.remarks", ""] },

        verificationStatus: {
          $cond: [
            { $eq: ["$role.name", "agent"] },
            { $ifNull: ["$agent.verificationStatus", null] },
            "$$REMOVE",
          ],
        },

        agentDetails: {
          $cond: [
            { $eq: ["$role.name", "agent"] },
            {
              name: { $ifNull: ["$agent.name", ""] },
              bio: { $ifNull: ["$agent.bio", ""] },
              agencyName: { $ifNull: ["$agent.agencyName", ""] },
              licenseNumber: { $ifNull: ["$agent.licenseNumber", ""] },
              locality: { $ifNull: ["$agent.locality", ""] },
              city: { $ifNull: ["$agent.city", ""] },
              experienceYears: { $ifNull: ["$agent.experienceYears", 0] },
              dealsClosed: { $ifNull: ["$agent.dealsClosed", 0] },
              areasServed: { $ifNull: ["$agent.areasServed", []] },
              languages: { $ifNull: ["$agent.languages", []] },
              avatar: { $ifNull: ["$agent.avatar", null] },
              coverImage: { $ifNull: ["$agent.coverImage", null] },
              rera: {
                reraAgentId: { $ifNull: ["$agent.rera.reraAgentId", ""] },
                isVerified: { $ifNull: ["$agent.rera.isVerified", false] },
              },
              stats: {
                totalProperties: { $ifNull: ["$agent.stats.totalProperties", 0] },
                publishedCount: { $ifNull: ["$agent.stats.publishedCount", 0] },
              },
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
    const normalizedPhone = getPhoneLookupValues(phone).find(
      (value) => value.length === 10,
    );
    email = email?.trim()?.toLowerCase();

    // Validate phone
    if (!phone && !email) {
      return res.status(400).json({
        message: "Either phone or email is required",
      });
    }

    const otp = genOtp();
    
    const key = normalizedPhone || phone || email;

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
    let { email, phone, otp, name, role, companyName } = req.body;

    email = email?.trim()?.toLowerCase();
    phone = phone?.trim();
    const normalizedPhone = getPhoneLookupValues(phone).find(
      (value) => value.length === 10,
    );
    otp = otp?.trim();
    companyName = companyName?.trim();

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

    name = name?.trim();
    role = role?.trim()?.toLowerCase();
    let user = await User.findOne({
      phone: { $in: getPhoneLookupValues(phone) },
    }).populate("roleId");

    const nameError = user ? "" : validateSignupName(name);
    if (!user && nameError) {
      return res.status(400).json({
        message: nameError,
        field: "name",
        code: "VALIDATION_ERROR",
      });
    }

    if (!role) {
      return res.status(400).json({
        message: "Role is required",
        field: "role",
        code: "VALIDATION_ERROR",
      });
    }

    const companyNameError =
      !user && role === "builder" ? validateCompanyName(companyName) : "";
    if (companyNameError) {
      return res.status(400).json({
        message: companyNameError,
        field: "companyName",
        code: "VALIDATION_ERROR",
      });
    }

    // verify OTP
    const otpResult = await verifyDummyOrRedisOtp({
      phone,
      key: normalizedPhone || phone,
      otp,
    });

    if (!otpResult.valid) {
      return res.status(400).json({
        ...getOtpFailureResponse(otpResult),
      });
    }

    // USER EXISTS
    if (user) {
      if (user.accountStatus === "active") {
        return res.status(409).json({
          message: "Account already registered. Please login.",
        });
      }

      const roleDoc: any = user.roleId;

      const token = await createAuthToken({ user, roleDoc });

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
      name: role,
    });

    if (!roleDoc) {
      return res.status(400).json({
        message: "Invalid role",
      });
    }

    user = await User.create({
      name,
      companyName: role === "builder" ? companyName : undefined,
      email: email || undefined,
      phone: normalizedPhone || phone,
      roleId: roleDoc._id,
      phoneVerified: true,
      accountStatus: "location_pending",
      kyc: {
        status: "not_started",
      },
    });

    if (roleDoc.name === "agent") {
      await createInitialAgentProfile(user._id);
    }

    const token = await createAuthToken({ user, roleDoc });

    return res.status(201).json({
      message: "Account created. Continue signup.",
      token,
      nextStep: "location",
      kycStatus: "not_started",
    });
  } catch (error: any) {
    if (error?.name === "ValidationError") {
      const firstError = Object.values(error.errors || {})[0] as any;
      return res.status(400).json({
        message: firstError?.message || "Validation failed",
        field: firstError?.path,
        code: "VALIDATION_ERROR",
      });
    }

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

    let user = await User.findOne({ email }).populate("roleId");

    const nameError = user ? "" : validateSignupName(name);
    if (!user && nameError) {
      return res.status(400).json({
        message: nameError,
        field: "name",
        code: "VALIDATION_ERROR",
      });
    }

    const otpResult = await verifyAndConsumeOtpWithReason(email, otp);

    if (!otpResult.valid) {
      return res.status(400).json({
        ...getOtpFailureResponse(otpResult),
      });
    }

    if (user) {
      if (user.isActive === false) {
        return res.status(403).json({
          message: deletedAccountMessage,
        });
      }

      const roleDoc: any = user.roleId;
      const token = await createAuthToken({ user, roleDoc });

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

    if (roleDoc.name === "agent") {
      await createInitialAgentProfile(user._id);
    }

    const token = await createAuthToken({ user, roleDoc });

    return res.status(201).json({
      message: "Account created. Continue signup.",
      token,
      nextStep: "location",
    });
  } catch (error: any) {
    if (error?.name === "ValidationError") {
      const firstError = Object.values(error.errors || {})[0] as any;
      return res.status(400).json({
        message: firstError?.message || "Validation failed",
        field: firstError?.path,
        code: "VALIDATION_ERROR",
      });
    }

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
    // check auth
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    let { locality, city, state, pincode } = req.body;

    // validation
    if (!locality || !city || !state || !pincode) {
      return res.status(400).json({
        success: false,
        message: "All location fields are required",
      });
    }

    // trim values
    locality = locality.trim();
    city = city.trim();
    state = state.trim();
    pincode = pincode.trim();

    // fetch user
    const user = await User.findById(req.user.id).populate("roleId");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // role document
    const roleDoc: any = user.roleId;

    console.log("ROLE DOC:", roleDoc);
    console.log("ROLE NAME:", roleDoc?.name);

    // check role exists
    if (!roleDoc?.name) {
      return res.status(400).json({
        success: false,
        message: "Role not assigned to user",
      });
    }

    // check allowed roles
    if (!ADMIN_CREATE_ROLES.has(roleDoc.name)) {
      return res.status(403).json({
        success: false,
        message:
          "This endpoint is only allowed for admin-created roles",
      });
    }

    // prevent duplicate onboarding
    if (user.accountStatus === "active") {
      return res.status(400).json({
        success: false,
        message: "Location already updated",
      });
    }

    // update user location
    user.locality = locality;
    user.city = city;
    user.state = state;
    user.pincode = pincode;

    // activate account
    user.accountStatus = "active";

    await user.save();

    // create fresh token
    const token = await createAuthToken({
      user,
      roleDoc,
    });

    return res.status(200).json({
      success: true,
      message:
        "Location updated successfully. Account is now active.",
      token,
      user,
    });
  } catch (error: any) {
    console.error(
      "ADMIN CREATE UPDATE LOCATION ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
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
      companyName: updatedUser.companyName,
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
      "companyName",
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
        companyName: user.companyName,
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

export const requestAdminUserPhoneChangeOtp = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.user?.sub) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!["admin", "super_admin"].includes(req.user.roleName || "")) {
      return res.status(403).json({
        message: "Forbidden: only admin/super_admin can update user profiles",
      });
    }

    const { id } = req.params;
    const phone = req.body.phone?.toString().trim();

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const phoneError = validatePhoneNumber(phone);
    if (phoneError) {
      return res.status(400).json({ message: phoneError });
    }

    const user = await User.findById(id).select("_id phone");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (getPhoneLookupValues(phone).includes(String(user.phone || ""))) {
      return res.status(400).json({
        message: "This phone number is already linked to this account",
      });
    }

    const existingUser = await User.findOne({
      _id: { $ne: user._id },
      phone: { $in: getPhoneLookupValues(phone) },
    }).select("_id");

    if (existingUser) {
      return res.status(409).json({
        message: "Phone number already exists. Please use a different phone number.",
      });
    }

    const otp = genOtp();
    await saveOtpToRedis(
      getAdminPhoneChangeOtpKey(req.user.sub, String(user._id), phone),
      otp
    );
    await sendOtpWhatsApp(phone, otp);

    return res.status(200).json({
      message: "OTP sent to new phone number",
      phone,
    });
  } catch (error: any) {
    return res.status(500).json({
      message: "Failed to send phone verification OTP",
      error: error.message,
    });
  }
};

export const updateUserProfileById = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.user?.sub) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!["admin", "super_admin"].includes(req.user.roleName || "")) {
      return res.status(403).json({
        message: "Forbidden: only admin/super_admin can update user profiles",
      });
    }

    const { id } = req.params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const updates: Record<string, unknown> = {};

    for (const key of ADMIN_PROFILE_UPDATE_FIELDS) {
      if (req.body[key] === undefined) continue;

      if (typeof req.body[key] === "string") {
        const cleaned = req.body[key].trim();
        if (key === "email") {
          updates[key] = cleaned ? cleaned.toLowerCase() : undefined;
        } else if (key === "phone") {
          updates[key] = cleaned;
        } else {
          updates[key] = cleaned;
        }
      } else {
        updates[key] = req.body[key];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "No valid fields to update" });
    }

    if (updates.name !== undefined && String(updates.name).trim().length === 0) {
      return res.status(400).json({ message: "Name is required" });
    }

    if (updates.phone !== undefined) {
      const phoneError = validatePhoneNumber(String(updates.phone));
      if (phoneError) {
        return res.status(400).json({ message: phoneError });
      }
    }

    const user = await User.findById(id).populate("roleId");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const phoneChanged =
      updates.phone !== undefined && String(updates.phone) !== String(user.phone || "");

    if (phoneChanged) {
      const phoneOtp = req.body.phoneOtp?.toString().trim();

      if (!phoneOtp) {
        return res.status(400).json({
          message: "OTP is required to update phone number",
        });
      }

      const existingUser = await User.findOne({
        _id: { $ne: user._id },
        phone: { $in: getPhoneLookupValues(String(updates.phone)) },
      }).select("_id");

      if (existingUser) {
        return res.status(409).json({
          message: "Phone number already exists. Please use a different phone number.",
        });
      }

      const otpResult = await verifyAndConsumeOtpWithReason(
        getAdminPhoneChangeOtpKey(req.user.sub, String(user._id), String(updates.phone)),
        phoneOtp
      );

      if (!otpResult.valid) {
        return res.status(400).json({
          ...getOtpFailureResponse(otpResult),
        });
      }
    }

    if (phoneChanged && user.phone) {
      user.phoneHistory = [
        ...((user.phoneHistory as any[]) || []),
        {
          phone: user.phone,
          changedAt: new Date(),
          changedBy: new mongoose.Types.ObjectId(req.user.sub),
        },
      ] as any;
    }

    if (phoneChanged) {
      user.phoneVerified = true;
    }

    Object.assign(user, updates);
    await user.save();

    const role: any = user.roleId;

    return res.status(200).json({
      message: "User profile updated successfully",
      user: {
        id: user._id,
        name: user.name,
        companyName: user.companyName,
        email: user.email,
        phone: user.phone,
        phoneHistory: user.phoneHistory ?? [],
        address: user.address,
        locality: user.locality,
        city: user.city,
        state: user.state,
        pincode: user.pincode,
        accountStatus: user.accountStatus,
        phoneVerified: user.phoneVerified,
        roleId: role ? String(role._id) : null,
        roleName: role ? role.name : null,
        permissions: role ? role.permissions : [],
      },
    });
  } catch (error: any) {
    console.error("Admin update profile error:", error);

    if (error?.code === 11000 && error?.keyPattern?.email) {
      return res.status(409).json({
        message: "Email already exists. Please use a different email.",
      });
    }

    if (error?.code === 11000 && error?.keyPattern?.phone) {
      return res.status(409).json({
        message: "Phone number already exists. Please use a different phone number.",
      });
    }

    if (error?.name === "ValidationError") {
      const firstError = Object.values(error.errors || {})[0] as any;
      return res.status(400).json({
        message: firstError?.message || "Validation failed",
      });
    }

    return res.status(500).json({ message: "Failed to update user profile" });
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
