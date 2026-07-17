import mongoose, { Schema, Types } from "mongoose";

const BuilderDetailsSchema = new Schema(
  {
    builderId: {
      type: Types.ObjectId,
      ref: "Builder",
    },
    name: {
      type: String,
      trim: true,
    },
    companyName: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    userCode: {
      type: String,
      trim: true,
    },
    locality: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      trim: true,
    },
    state: {
      type: String,
      trim: true,
    },
    pincode: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
  },
  { _id: false },
);

const BuilderInvoiceSchema = new Schema(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },

    invoiceDate: {
      type: Date,
      required: true,
      default: Date.now,
    },

    userId: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    builderDetails: {
      type: BuilderDetailsSchema,
      default: {},
    },

    propertyId: {
      type: Types.ObjectId,
      ref: "featuredProject",
      required: true,
      index: true,
    },

    propertyTitle: {
      type: String,
      trim: true,
    },

    servicePlanId: {
      type: Types.ObjectId,
      ref: "BuilderPlan",
      required: true,
      index: true,
    },

    servicePlanName: {
      type: String,
      required: true,
      trim: true,
    },

    // serviceType: {
    //   type: String,
    //   required: true,
    //   enum: ["listing", "promotion", "subscription"],
    //   trim: true,
    // },

    timePeriod: {
      type: String,
      required: true,
      trim: true,
    },

    startDate: {
      type: Date,
    },

    endDate: {
      type: Date,
    },

    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    discountType: {
      type: String,
      default: "percentage",
      trim: true,
    },

    discountValue: {
      type: Number,
      default: 0,
      min: 0,
    },

    discountAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    paidAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    paymentMethod: {
      type: String,
      required: true,
      enum: ["razorpay", "upi", "card", "netbanking", "cheque", "cash"],
      trim: true,
    },

    paymentStatus: {
      type: String,
      required: true,
      enum: ["pending", "paid", "partial", "failed"],
      default: "pending",
      index: true,
    },

    paymentId: {
      type: String,
      trim: true,
    },

    orderId: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true },
);

BuilderInvoiceSchema.index({ userId: 1, invoiceDate: -1 });
BuilderInvoiceSchema.index({ propertyId: 1, servicePlanId: 1 });

export const BuilderInvoice = mongoose.model(
  "BuilderInvoice",
  BuilderInvoiceSchema,
);
