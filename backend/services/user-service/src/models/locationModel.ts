import mongoose from 'mongoose';

const CitySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    state: { type: String, default: null },
    category: { type: String, required: true },

    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], default: [0, 0] } // [lng, lat]
    }
  },
  { timestamps: true }
);

// indexes
CitySchema.index({ name: "text", state: "text" });
CitySchema.index({ location: "2dsphere" });

const Location = mongoose.model("Location", CitySchema);
export default Location;
