import mongoose, { Schema } from "mongoose";



const BuilderSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  name: { type: String, required: true },
  slug: { type: String, index: true, unique: true },
  company: String,
  bio: String,
  avatar: String,
  coverImage: String,
  contact: { phone: String, email: String, website: String },
  officeLocations: [String],
  verified: { type: Boolean, default: false },
  verificationStatus: { type: String, enum: ['pending','approved','rejected','business_verified'], default: 'pending' },
  verificationDocuments: [{ type: { type: String }, url: String, providerResponse: Schema.Types.Mixed, status: String }],
  gst: { gstin: String, providerResponse: Schema.Types.Mixed },
  mca: { cin: String, providerResponse: Schema.Types.Mixed },
  rera: { reraId: String, providerResponse: Schema.Types.Mixed, isVerified: Boolean },
  stats: { totalProperties: { type: Number, default: 0 }, publishedCount: { type: Number, default: 0 } }
}, { timestamps: true });

const Builder = mongoose.model('Builder', BuilderSchema);
export default Builder;



