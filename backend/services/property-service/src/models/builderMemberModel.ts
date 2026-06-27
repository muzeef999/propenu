import mongoose from "mongoose";

const BuilderMemberSchema = new mongoose.Schema(
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

const BuilderMember = (mongoose.models.BuilderMember ||
  mongoose.model("BuilderMember", BuilderMemberSchema)) as mongoose.Model<any>;

export default BuilderMember;
