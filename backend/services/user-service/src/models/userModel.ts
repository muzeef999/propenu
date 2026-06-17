import mongoose, { Types } from "mongoose";
import Counter from "./counterModel";
import Role from "./roleModel";

export interface IUser extends mongoose.Document {
  name: string;
  companyName?: string;
  email?: string;
  phone?: string;
  locality?: string;
  city?: string;
  state?: string;
  pincode?: string;
  address?: string;
  phoneVerified?: boolean;
  accountStatus?:
    | "pending"
    | "location_pending"
    | "kyc_pending"
    | "kyc_rejected"
    | "active";
  kyc?: {
    status?: "not_started" | "pending" | "verified" | "rejected";
    provider?: "digilocker" | "pan" | "manual";
    documents?: string[];
    verifiedName?: string;
    verifiedPhone?: string;
    verifiedDob?: string;
    digilockerId?: string;
    verifiedAt?: Date;
    remarks?: string;
  };
  builderId?: Types.ObjectId;
  userCode: string;
  roleId?: Types.ObjectId;
  managerId?: Types.ObjectId;
  isActive?: boolean;
  lastLoginAt?: Date;
  loginCount?: number;
  fcmToken?: string | null;
}

const getCityCode = (city?: string) => {
  const normalizedCity = city?.replace(/[^a-zA-Z0-9]/g, "").toUpperCase() ?? "";

  if (normalizedCity.length < 3) {
    throw new Error("City must contain at least 3 letters to generate userCode");
  }

  return normalizedCity.slice(0, 3);
};

const getEntityCode = async (roleId?: Types.ObjectId | null) => {
  if (!roleId) {
    return "USR";
  }

  const role = await Role.findById(roleId).select("name").lean();
  const roleName = role?.name?.toLowerCase();

  if (roleName === "agent" || roleName === "sales_agent") {
    return "AGT";
  }

  if (roleName === "builder") {
    return "BLD";
  }

  return "USR";
};

const getCounterKey = (entityCode: string, cityCode: string, yearCode: string) =>
  `${entityCode}_${cityCode}_${yearCode}`;

const KycSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ["not_started", "pending", "verified", "rejected"],
    default: "not_started",
  },
  provider: {
    type: String,
    enum: ["digilocker", "pan", "manual"],
  },
  documents: [
    {
      type: String, // PAN, Aadhaar, DL etc
    },
  ],
  verifiedName: String,
  verifiedPhone: String,
  verifiedDob: String,
  digilockerId: String,
  verifiedAt: Date,
  remarks: String,
});

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 42,
      index: true,
    },
    companyName: {
      type: String,
      trim: true,
      maxlength: 80,
      index: true,
    },
    email: {
      type: String,
      required: true, // ✅ make this optional if you're using phone too
      unique: false,
      trim: true,
      lowercase: true,
      sparse: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email"],
    },
    phone: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
      index: true,
      match: [/^\+?[1-9]\d{6,14}$/, "Invalid phone number"],
    },
    kyc: {
      type: KycSchema,
      default: () => ({
        status: "not_started",
      }),
    },
    locality: {
      type: String,
      trim: true,
      minlength: 3,
      maxlength: 45,
      index: true,
    },
    city: {
      type: String,
      trim: true,
      minlength: 3,
      maxlength: 45,
      index: true,
    },
    userCode: {
      type: String,
      unique: true,
      index: true,
      sparse: true,
      trim: true,
    },
    state: {
      type: String,
      trim: true,
      minlength: 3,
      maxlength: 45,
      index: true,
    },
    pincode: {
      type: String,
      trim: true,
      minlength: 3,
      maxlength: 45,
      index: true,
    },
    phoneVerified: {
      type: Boolean,
      default: false,
    },
    accountStatus: {
      type: String,
      enum: ["pending", "location_pending", "kyc_pending", "kyc_rejected", "active"],
      default: "location_pending",
    },
    address: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    builderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Builder",
      required: false,
      index: true,
    },
    roleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
      required: false,
    },
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },

    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date },
    loginCount: { type: Number, default: 0 },

    fcmToken: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true, // automatically adds createdAt & updatedAt
  },
);

// 🛡️ Require at least one of email or phone
UserSchema.path("email").validate(function () {
  return this.email || this.phone;
}, "Either email or phone is required");

UserSchema.path("phone").validate(function () {
  return this.email || this.phone;
}, "Either email or phone is required");

UserSchema.pre("save", async function (next) {
  try {
    if (this.userCode) {
      return next();
    }

    if (!this.city) {
      return next();
    }

    const yearCode = new Date().getFullYear().toString().slice(-2);
    const cityCode = getCityCode(this.city);
    const entityCode = await getEntityCode(this.roleId);
    const counterKey = getCounterKey(entityCode, cityCode, yearCode);

    const counter = await Counter.findOneAndUpdate(
      { key: counterKey },
      { $inc: { seq: 1 } },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    );

    this.userCode = `P${yearCode}${cityCode}${entityCode}${String(counter.seq).padStart(6, "0")}`;

    next();
  } catch (error) {
    next(error as Error);
  }
});

// ✅ Use ESM export, not CommonJS
const User = mongoose.model<IUser>("User", UserSchema);
export default User;
