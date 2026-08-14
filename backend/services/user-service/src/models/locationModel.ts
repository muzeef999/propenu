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
    /** When true, city appears on propenu.com location picker. Default off (inactive). */
    isHome: { type: Boolean, default: false },
  },
  { timestamps: true }
);

CitySchema.index({ isHome: 1 });

// indexes
CitySchema.index({ city: 1, state: 1 }, { unique: true });

CitySchema.index({ city: 1, "localities.name": 1 });

CitySchema.index({ "localities.location": "2dsphere" });


CitySchema.pre("save", function (next) {
  if (!this.localities || this.localities.length === 0) {
    return next();
  }

  const names = this.localities.map((l) => l.name.toLowerCase().trim());
  const uniqueNames = new Set(names);

  if (names.length !== uniqueNames.size) {
    return next(new Error("Duplicate locality names in same city"));
  }

  next();
});


const Location = mongoose.model("Location", CitySchema);
export default Location;
