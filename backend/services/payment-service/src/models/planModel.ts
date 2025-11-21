import mongoose from "mongoose";
import { IPlan } from "../types/razorpay";

const planSchema = new mongoose.Schema<IPlan>({
planId : { type: String, required: true, unique: true },
name: { type: String, required: true },
priceCents: { type: Number, required: true },
currency: { type: String, default: 'INR' },
interval: { type: String, enum: ['month','year'], default: 'month' },
features: [String],
active: { type: Boolean, default: true }
}, { timestamps: true });



const plan = mongoose.model('Plan', planSchema);
export default plan;