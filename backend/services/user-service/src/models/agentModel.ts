import mongoose, { Schema } from "mongoose";
import { Agent } from "../types/agent";

const AgentSchema = new Schema<Agent>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  name: { type: String, required: true },
  slug: { type: String, unique: true },
  avatar: {url: String, key: String},
  coverImage: {url: String, key: String},
  bio: String,
  agencyName: String,
  licenseNumber: String,
  licenseValidTill: Date,
  areasServed: [String],
  city: { type: String },
  experienceYears: { type: Number },
  dealsClosed: { type: Number },
  languages: [{ type: String }],
  verificationStatus: { type: String, enum: ['pending','approved','rejected'], default: 'pending' },
  verificationDocuments: [{ type: { type: String }, url: String, providerResponse: Schema.Types.Mixed, status: String }],
  rera: { reraAgentId: String, providerResponse: Schema.Types.Mixed, isVerified: Boolean },
  stats: { totalProperties: { type: Number, default: 0 }, publishedCount: { type: Number, default: 0 } }
}, { timestamps: true });


const Agent = mongoose.model('Agent', AgentSchema);
export default Agent;
