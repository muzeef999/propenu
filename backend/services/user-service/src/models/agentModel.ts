import mongoose, { Schema } from "mongoose";

const AgentSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', unique: true },
  name: { type: String, required: true },
  slug: { type: String, unique: true },
  avatar: String,
  coverImage: String,
  bio: String,
  agencyName: String,
  licenseNumber: String,
  licenseValidTill: Date,
  areasServed: [String],
  verificationStatus: { type: String, enum: ['pending','approved','rejected'], default: 'pending' },
  verificationDocuments: [{ type: { type: String }, url: String, providerResponse: Schema.Types.Mixed, status: String }],
  rera: { reraAgentId: String, providerResponse: Schema.Types.Mixed, isVerified: Boolean },
  stats: { totalProperties: { type: Number, default: 0 }, publishedCount: { type: Number, default: 0 } }
}, { timestamps: true });


const Agent = mongoose.model('Agent', AgentSchema);
export default Agent;
