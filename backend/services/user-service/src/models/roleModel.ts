import mongoose from "mongoose";

const roleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,                
      lowercase: true,
      trim: true,
    },
    label: {
      type: String,
      required: true,              
    },
    permissions: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    roleType: {
      type: String,
      enum: ["system", "custom"],
      default: "custom",
    },
    isProtected: {
      type: Boolean,
      default: false,
    },
    parentRoleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
      default: null,
      index: true,
    },
  },
  { timestamps: true }
);

const Role = mongoose.model("Role", roleSchema);
export default Role;
