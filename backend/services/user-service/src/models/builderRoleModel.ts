import mongoose, { Types } from "mongoose";

export interface IBuilderRole extends mongoose.Document {
  builderId: Types.ObjectId;
  name: string;
  permissions: string[];
  isActive: boolean;
  createdBy: Types.ObjectId;
}

const BuilderRoleSchema = new mongoose.Schema<IBuilderRole>(
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

const BuilderRole =
  (mongoose.models.BuilderRole as mongoose.Model<IBuilderRole>) ||
  mongoose.model<IBuilderRole>("BuilderRole", BuilderRoleSchema);

export default BuilderRole;
