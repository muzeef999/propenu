import mongoose, { Schema } from "mongoose";

const BhkSummarySchema = new Schema(
  {
    bhk: { type: Number, required: true },        // 2, 2.5, 3, 4 ...
    bhkLabel: { type: String },                   // "2 BHK"
    minSqft: { type: Number },
    maxSqft: { type: Number },
    minPrice: { type: Number },
    maxPrice: { type: Number },
    availableCount: { type: Number, default: 0 }
  },
  { _id: false }
);

const GallerySummarySchema = new Schema(
  {
    title: { type: String },
    url: { type: String, required: true },
    category: { type: String }, // "Exterior"|"Interior"|"Amenity"|"Floorplan"
    order: { type: Number, default: 0 }
  },
  { _id: false }
);

const AmenitySchema = new Schema(
  {
    key: { type: String },       // "swimming_pool"
    title: { type: String },     // "Swimming Pool"
    description: { type: String },
    icon: { type: String }       // icon name or URL
  },
  { _id: false }
);

const SpecificationItemSchema = new Schema(
  {
    title: { type: String },
    description: { type: String }
  },
  { _id: false }
);

const SpecificationSchema = new Schema(
  {
    category: { type: String },        // "Structure Work", "Finishing Work"
    items: [SpecificationItemSchema],
    order: { type: Number, default: 0 }
  },
  { _id: false }
);

const NearbyPlaceSchema = new Schema(
  {
    name: { type: String },
    type: { type: String },            // "School","Hospital","Mall","IT Park"
    distanceText: { type: String },    // "10 mins" or "3.1 km"
    coordinates: { type: [Number] },   // [lng, lat]
    order: { type: Number, default: 0 }
  },
  { _id: false }
);


const FeaturePropertyModel = new Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    developer: { type: Schema.Types.ObjectId, ref: "builders" },
    about: { type: String },                
    featuredTagline: { type: String },

    // address & map
    address: { type: String, required: true },
    city: { type: String },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point"
      },
      coordinates: {
        type: [Number], // [lng, lat]
        index: "2dsphere"
      }
    },
    mapEmbedUrl: { type: String },           // iframe/embed link for map view

    // pricing & bhk summary
    currency: { type: String, default: "INR" },
    priceFrom: { type: Number },             // convenience aggregated min price
    priceTo: { type: Number },
    bhkSummary: { type: [BhkSummarySchema], default: [] },

    // area & possession
    sqftRange: {
      min: { type: Number },
      max: { type: Number }
    },
    possessionDate: { type: String },        // "Dec, 2027"

    // project attributes
    totalTowers: { type: Number },
    totalFloors: { type: String },           // "G+22"
    projectArea: { type: Number },           // acres or unit you choose
    totalUnits: { type: Number },
    availableUnits: { type: Number },

    // legal & trust
    reraNumber: { type: String },
    banksApproved: [{ type: String }],       // ["ICICI","HDFC"]

    // media
    heroImage: { type: String },
    heroVideo: { type: String },
    gallery: [{ type: Schema.Types.ObjectId, ref: "GalleryImage" }],
    gallerySummary: { type: [GallerySummarySchema], default: [] },

    // brochure / downloads
    brochureUrl: { type: String },            // PDF download link
    brochureFileName: { type: String },

    // specs & amenities
    specifications: { type: [SpecificationSchema], default: [] },
    amenities: { type: [AmenitySchema], default: [] },

    // nearby / neighbourhood
    nearbyPlaces: { type: [NearbyPlaceSchema], default: [] },

    // visibility & ordering
    isFeatured: { type: Boolean, default: true },
    rank: { type: Number, default: 1 },

    meta: {
      views: { type: Number, default: 0 },
      inquiries: { type: Number, default: 0 },
      clicks: { type: Number, default: 0 }
    },

    status: {
      type: String,
      enum: ["active", "inactive", "archived"],
      default: "active"
    },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);

FeaturePropertyModel.index({ title: "text", address: "text", city: "text" });
FeaturePropertyModel.index({ slug: 1 }, { unique: true });

FeaturePropertyModel.pre("validate", function (next) {
  if (!this.slug && this.title) {
    this.slug = String(this.title)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }
  next();
});

const FeaturedProject = mongoose.model("FeaturedProject", FeaturePropertyModel);
export default FeaturedProject;
