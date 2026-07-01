import { Response } from "express";
import User from "../models/userModel";
import { AuthRequest } from "../middlewares/authMiddleware";
import { genOtp } from "../utils/genOtp";
import { saveOtpToRedis, verifyAndConsumeOtpWithReason } from "../utils/saveOtpRedis";
import { sendOtpWhatsApp } from "../utils/whatsapp";

const allowedBuilderProfileFields = [
  "name",
  "companyName",
  "email",
  "address",
  "locality",
  "city",
  "state",
  "pincode",
] as const;

const formatBuilderProfile = (user: any, role: any) => ({
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
});

const isPrimaryBuilder = (req: AuthRequest) => req.user?.roleName === "builder";
const isBuilderProfileAdmin = (req: AuthRequest) =>
  req.user?.roleName === "admin" || req.user?.roleName === "super_admin";

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

const getPhoneChangeOtpKey = (userId: string, phone: string) =>
  `builder-phone-change:${userId}:${phone}`;

const validatePhoneForOtp = (phone?: string) => {
  const trimmed = phone?.trim();

  if (!trimmed) {
    return "Phone number is required";
  }

  if (!/^\+?[1-9]\d{6,14}$/.test(trimmed)) {
    return "Invalid phone number";
  }

  return "";
};

const assertTargetIsBuilder = (user: any) => {
  const role: any = user?.roleId;
  return role?.name === "builder";
};

const buildProfileUpdates = (body: Record<string, unknown>) => {
  const updates: Record<string, unknown> = {};

  for (const key of allowedBuilderProfileFields) {
    if (body[key] === undefined) continue;

    if (typeof body[key] === "string") {
      const cleaned = body[key].trim();
      updates[key] = key === "email" ? cleaned.toLowerCase() || undefined : cleaned;
    } else {
      updates[key] = body[key];
    }
  }

  return updates;
};

export const getBuilderProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.sub) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!isPrimaryBuilder(req)) {
      return res.status(403).json({
        message: "Only builder accounts can view builder profile settings",
      });
    }

    const user = await User.findById(req.user.sub).populate("roleId");

    if (!user) {
      return res.status(404).json({ message: "Builder profile not found" });
    }

    const role: any = user.roleId;

    return res.status(200).json({
      message: "Builder profile loaded",
      profile: formatBuilderProfile(user, role),
    });
  } catch (error: any) {
    return res.status(500).json({
      message: "Failed to load builder profile",
      error: error.message,
    });
  }
};

export const updateBuilderProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.sub) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!isPrimaryBuilder(req)) {
      return res.status(403).json({
        message: "Only builder accounts can update builder profile settings",
      });
    }

    const updates = buildProfileUpdates(req.body);

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "No valid fields to update" });
    }

    if (updates.name === "") {
      return res.status(400).json({ message: "Name is required" });
    }

    if (updates.companyName === "") {
      return res.status(400).json({ message: "Company name is required" });
    }

    const user = await User.findById(req.user.sub).populate("roleId");

    if (!user) {
      return res.status(404).json({ message: "Builder profile not found" });
    }

    Object.assign(user, updates);
    await user.save();

    const role: any = user.roleId;

    return res.status(200).json({
      message: "Builder profile updated successfully",
      profile: formatBuilderProfile(user, role),
    });
  } catch (error: any) {
    if (error?.code === 11000 && error?.keyPattern?.email) {
      return res.status(409).json({
        message: "Email already exists. Please use a different email.",
      });
    }

    if (error?.name === "ValidationError") {
      const firstError = Object.values(error.errors || {})[0] as any;
      return res.status(400).json({
        message: firstError?.message || "Validation failed",
      });
    }

    return res.status(500).json({
      message: "Failed to update builder profile",
      error: error.message,
    });
  }
};

export const requestBuilderPhoneChangeOtp = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    if (!req.user?.sub) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!isPrimaryBuilder(req)) {
      return res.status(403).json({
        message: "Only builder accounts can update builder phone number",
      });
    }

    const phone = req.body.phone?.toString().trim();
    const phoneError = validatePhoneForOtp(phone);

    if (phoneError) {
      return res.status(400).json({ message: phoneError });
    }

    const user = await User.findById(req.user.sub);

    if (!user) {
      return res.status(404).json({ message: "Builder profile not found" });
    }

    if (getPhoneLookupValues(phone).includes(String(user.phone || ""))) {
      return res.status(400).json({
        message: "This phone number is already linked to your account",
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
    await saveOtpToRedis(getPhoneChangeOtpKey(String(user._id), phone), otp);
    await sendOtpWhatsApp(phone, otp);

    return res.status(200).json({
      message: "OTP sent to new phone number",
      oldPhone: user.phone,
      phone,
    });
  } catch (error: any) {
    return res.status(500).json({
      message: "Failed to send phone verification OTP",
      error: error.message,
    });
  }
};

export const verifyBuilderPhoneChangeOtp = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    if (!req.user?.sub) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!isPrimaryBuilder(req)) {
      return res.status(403).json({
        message: "Only builder accounts can update builder phone number",
      });
    }

    const phone = req.body.phone?.toString().trim();
    const otp = req.body.otp?.toString().trim();
    const phoneError = validatePhoneForOtp(phone);

    if (phoneError) {
      return res.status(400).json({ message: phoneError });
    }

    if (!otp) {
      return res.status(400).json({ message: "OTP is required" });
    }

    const user = await User.findById(req.user.sub).populate("roleId");

    if (!user) {
      return res.status(404).json({ message: "Builder profile not found" });
    }

    const otpResult = await verifyAndConsumeOtpWithReason(
      getPhoneChangeOtpKey(String(user._id), phone),
      otp,
    );

    if (!otpResult.valid) {
      return res.status(400).json({
        message:
          otpResult.reason === "expired"
            ? "OTP has expired or is no longer valid. Please request a new OTP."
            : "Incorrect OTP. Please check the code and try again.",
        reason: otpResult.reason,
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

    const oldPhone = user.phone;
    if (oldPhone) {
      user.phoneHistory = [
        ...((user.phoneHistory as any[]) || []),
        {
          phone: oldPhone,
          changedAt: new Date(),
          changedBy: user._id,
        },
      ] as any;
    }
    user.phone = phone;
    user.phoneVerified = true;
    await user.save();

    const role: any = user.roleId;

    return res.status(200).json({
      message: "Phone number updated successfully",
      oldPhone,
      profile: formatBuilderProfile(user, role),
    });
  } catch (error: any) {
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

    return res.status(500).json({
      message: "Failed to verify phone number",
      error: error.message,
    });
  }
};

export const getBuilderProfileById = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.sub) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!isBuilderProfileAdmin(req)) {
      return res.status(403).json({
        message: "Only admin and super admin accounts can view a builder profile by id",
      });
    }

    const user = await User.findById(req.params.builderId).populate("roleId");

    if (!user || !assertTargetIsBuilder(user)) {
      return res.status(404).json({ message: "Builder profile not found" });
    }

    const role: any = user.roleId;

    return res.status(200).json({
      message: "Builder profile loaded",
      profile: formatBuilderProfile(user, role),
    });
  } catch (error: any) {
    return res.status(500).json({
      message: "Failed to load builder profile",
      error: error.message,
    });
  }
};

export const updateBuilderProfileById = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    if (!req.user?.sub) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!isBuilderProfileAdmin(req)) {
      return res.status(403).json({
        message: "Only admin and super admin accounts can update a builder profile by id",
      });
    }

    const updates = buildProfileUpdates(req.body);

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "No valid fields to update" });
    }

    if (updates.name === "") {
      return res.status(400).json({ message: "Name is required" });
    }

    if (updates.companyName === "") {
      return res.status(400).json({ message: "Company name is required" });
    }

    const user = await User.findById(req.params.builderId).populate("roleId");

    if (!user || !assertTargetIsBuilder(user)) {
      return res.status(404).json({ message: "Builder profile not found" });
    }

    Object.assign(user, updates);
    await user.save();

    const role: any = user.roleId;

    return res.status(200).json({
      message: "Builder profile updated successfully",
      profile: formatBuilderProfile(user, role),
    });
  } catch (error: any) {
    if (error?.code === 11000 && error?.keyPattern?.email) {
      return res.status(409).json({
        message: "Email already exists. Please use a different email.",
      });
    }

    if (error?.name === "ValidationError") {
      const firstError = Object.values(error.errors || {})[0] as any;
      return res.status(400).json({
        message: firstError?.message || "Validation failed",
      });
    }

    return res.status(500).json({
      message: "Failed to update builder profile",
      error: error.message,
    });
  }
};
