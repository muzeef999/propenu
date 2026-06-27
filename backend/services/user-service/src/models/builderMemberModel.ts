import mongoose, { Types } from "mongoose";

export interface IBuilderMember extends mongoose.Document {
  builderId: Types.ObjectId;
  userId: Types.ObjectId;
  builderRoleId: Types.ObjectId;
  projectIds: Types.ObjectId[];
  isActive: boolean;
  createdBy: Types.ObjectId;
}

const BuilderMemberSchema = new mongoose.Schema<IBuilderMember>(
  {
    builderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    builderRoleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BuilderRole",
      required: true,
    },
    projectIds: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "featuredProject",
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

BuilderMemberSchema.index({ builderId: 1, userId: 1 }, { unique: true });

const BuilderMember =
  (mongoose.models.BuilderMember as mongoose.Model<IBuilderMember>) ||
  mongoose.model<IBuilderMember>("BuilderMember", BuilderMemberSchema);

export default BuilderMember;
