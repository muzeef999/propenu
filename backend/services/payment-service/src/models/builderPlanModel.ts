import mongoose, { Schema } from "mongoose";

const BuilderPlanSchema = new Schema(
  {
    builder: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    project: {
      type: Schema.Types.ObjectId,
      ref: "featuredProject",
      required: true,
      index: true,
    },

    code: {
      type: String,
      required: true,
      trim: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    discount: {
      type: Number,
      default: 0,
      min: 0,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    promotionType: {
      type: String,
      required: true,
      trim: true,
    },

    finalPrice: {
      type: Number,
      default: 0,
      min: 0,
    },

    durationDays: {
      type: Number,
      default: 30,
      min: 1,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    features: {
      type: Map,
      of: Schema.Types.Mixed,
      default: () => ({}),
    },
  },
  { timestamps: true },
);

BuilderPlanSchema.index(
  { builder: 1, project: 1, code: 1 },
  { unique: true },
);

BuilderPlanSchema.pre("validate", function () {
  this.finalPrice = Math.max(this.price - this.discount, 0);
});

export const BuilderPlan = mongoose.model("BuilderPlan", BuilderPlanSchema);
