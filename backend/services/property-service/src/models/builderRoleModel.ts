import mongoose from "mongoose";

const BuilderRoleSchema = new mongoose.Schema(
  {
    builderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 60,
    },
    permissions: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

BuilderRoleSchema.index(
  { builderId: 1, name: 1 },
  { unique: true, collation: { locale: "en", strength: 2 } },
);

const BuilderRole = (mongoose.models.BuilderRole ||
  mongoose.model("BuilderRole", BuilderRoleSchema)) as mongoose.Model<any>;

export default BuilderRole;
