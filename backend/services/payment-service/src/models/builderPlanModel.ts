import mongoose, { Schema } from "mongoose";

const BuilderPlanSchema = new Schema(
  {
    code: {
      type: String,
      unique: true,
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
  },
  { timestamps: true },
);

BuilderPlanSchema.pre("save", function (next) {
  this.finalPrice = Math.max(this.price - this.discount, 0);
  next();
});

export const BuilderPlan = mongoose.model("BuilderPlan", BuilderPlanSchema);
