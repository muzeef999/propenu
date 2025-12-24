import mongoose from "mongoose";

const LocalitySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], default: [0, 0] }, // [lng, lat]
    },
  },
  { _id: false }
);

const CitySchema = new mongoose.Schema(
  {
    localities: {
      type: [LocalitySchema],
      default: [],
    },
    city: { type: String, required: true, trim: true },
    state: { type: String, default: null },
    category: { type: String, required: true },
  },
  { timestamps: true }
);

// indexes
CitySchema.index({ city: 1, state: 1 }, { unique: true });
CitySchema.index({ "localities.name": 1 });

const Location = mongoose.model("Location", CitySchema);
export default Location;
