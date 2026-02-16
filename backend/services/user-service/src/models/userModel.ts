import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
      index: true,
    },
    email: {
      type: String,
      required: false, // ✅ make this optional if you're using phone too
      unique: true,
      trim: true,
      lowercase: true,
      sparse: true,
      index: true,
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

// ✅ Use ESM export, not CommonJS
const User = mongoose.model("User", UserSchema);
export default User;
