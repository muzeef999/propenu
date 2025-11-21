import mongoose, { Document, Schema } from 'mongoose';
import { ISubscription } from '../types/razorpay';

const subscriptionSchema = new Schema<ISubscription>({
  subscriptionId: { type: String, required: true, unique: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  planId: { type: String, required: true },   // references Plan.planId
  months: { type: Number, required: true },   // 1,2,3
  priceCents: { type: Number, required: true }, // total price paid for the months
  currency: { type: String, default: 'INR' },
  status: { type: String, enum: ['active','inactive','cancelled','expired','trial'], default: 'active' },
  periodStart: { type: Date, required: true },
  periodEnd: { type: Date, required: true },
  providerData: { type: Object, default: {} }, // optional provider subscription payload
}, { timestamps: true });


const subscription = mongoose.model('Subscription', subscriptionSchema);
export default subscription;