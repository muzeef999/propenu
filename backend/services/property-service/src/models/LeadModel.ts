import { Schema, model, Types } from 'mongoose';

const LeadSchema = new Schema(
  {
    // Contact Info
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true, index: true },
    email: { type: String, trim: true },

    // 🔑 Polymorphic Property Reference
    propertyId: {
      type: Types.ObjectId,
      required: true,
      refPath: 'propertyModel',
      index: true,
    },

    // 👇 Tells Mongoose WHICH model to use
    propertyModel: {
      type: String,
      required: true,
      enum: [
        'FeaturedProject',
        'ResidentialProperty',
        'CommercialProperty',
        'AgriculturalProperty',
        'LandProperty',
      ],
      index: true,
    },

    // Optional: business-friendly type
    propertyType: {
      type: String,
      enum: ['residential', 'commercial', 'agricultural', 'land'],
      required: true,
      index: true,
    },

    // CRM Status
    status: {
      type: String,
      enum: [
        'new',
        'contacted',
        'follow_up',
        'approved',
        'rejected',
        'closed',
      ],
      default: 'new',
      index: true,
    },

    // Assignment
    assignedTo: {
      type: Types.ObjectId,
      ref: 'User',
      index: true,
    },

    approvedByManager: {
      type: Boolean,
      default: false,
    },

    source: {
      type: String, // website, whatsapp, walk-in
    },

    remarks: {
      type: String,
    },

    createdBy: {
      type: Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

export const Lead = model('Lead', LeadSchema);
