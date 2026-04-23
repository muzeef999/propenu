import mongoose, { Types } from "mongoose";

export interface IDeletedAccount extends mongoose.Document {
  userId: Types.ObjectId;
  name: string;
  email?: string | null;
  phone?: string | null;
  roleId?: Types.ObjectId | null;
  deletedAt: Date;
  deletionReason?: string | null;
  deletionFeedback?: string | null;
}

const deletedAccountSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: null,
      index: true,
    },
    phone: {
      type: String,
      trim: true,
      default: null,
      index: true,
    },
    roleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
      default: null,
    },
    deletedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    deletionReason: {
      type: String,
      trim: true,
      maxlength: 200,
      default: null,
    },
    deletionFeedback: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const DeletedAccount = mongoose.model("DeletedAccount", deletedAccountSchema);

export default DeletedAccount;
