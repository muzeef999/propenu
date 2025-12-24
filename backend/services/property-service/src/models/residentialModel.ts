// src/models/property/residential.model.ts
import mongoose, { Schema, Document, Model, Types } from "mongoose";
import {
  FLOORING_TYPES,
  IResidential,
  KITCHEN_TYPES,
  PROPERTY_AGE_BUCKETS,
  RESIDENTIAL_PROPERTY_TYPES,
} from "../types/residentialTypes";
import { BaseFields, FileRefSchema } from "./sharedSchemas";
import { TEXT_INDEX_FIELDS } from "../types/sharedTypes";
import { generateUniqueSlug, slugify } from "../utils/generateUniqueSlug";

export interface ResidentialDocument extends Document, IResidential {
  _id: Types.ObjectId;
}
/* Schema */
const ResidentialSchema = new Schema<IResidential>(
  {
    ...BaseFields,
    bhk: Number,
    bedrooms: Number,
    buildingName: String,
    bathrooms: Number,
    balconies: Number,
    carpetArea: Number,
    builtUpArea: Number,
    transactionType: {
      type: String,
      enum: ["new-sale", "resale"],
    },
    title: { type: String, required: true, trim: true },
    flooringType: { type: String, enum: FLOORING_TYPES },
    kitchenType: { type: String, enum: KITCHEN_TYPES },
    propertyAge: { type: String, enum: PROPERTY_AGE_BUCKETS },
    isModularKitchen: { type: Boolean, default: false },
    furnishing: {
      type: String,
      enum: ["unfurnished", "semi-furnished", "fully-furnished"],
    },
    parkingType: String,
    floorNumber: Number,
    totalFloors: Number,
    facing: {
      type: String,
      enum: ["east", "west", "north", "south"],
      lowercase: true,
      trim: true,
    },
    constructionStatus: {
      type: String,
      enum: ["ready-to-move", "under-construction"],
    },
    possessionDate: Date,
    parkingDetails: {
      visitorParking: Boolean,
      twoWheeler: Number,
      fourWheeler: Number,
    },
    propertyType: { type: String, enum: RESIDENTIAL_PROPERTY_TYPES },
  },
  { timestamps: true }
);

/* Indexes */
ResidentialSchema.index(TEXT_INDEX_FIELDS, { name: "Res_Text" });

ResidentialSchema.pre(
  "validate",
  async function (this: ResidentialDocument, next) {
    try {
      /* -------- TITLE -------- */
      if (!this.title) {
        this.title = buildResidentialTitle(this);
      }

      /* -------- SLUG -------- */
      if (!this.slug && this.title) {
        const baseSlug = slugify(this.title);
        this.slug = await generateUniqueSlug(
          mongoose.model("Residential"),
          baseSlug,
          this._id
        );
      }

      /* -------- LISTING SOURCE (CORRECTED) -------- */
      if (!this.listingSource && this.createdBy) {
        const User = mongoose.model("User");
        const Role = mongoose.model("Role");

        const user: any = await User.findById(this.createdBy)
          .select("role roleId")
          .lean();

        // 1️⃣ Direct role string on user (if exists)
        if (user?.role && typeof user.role === "string") {
          this.listingSource = user.role;
        }

        // 2️⃣ Role reference → Role.label
        else if (user?.roleId) {
          const roleDoc: any = await Role.findById(user.roleId)
            .select("label")
            .lean();

          if (roleDoc?.label) {
            this.listingSource = roleDoc.label;
          }
        }
      }

      /* -------- FINAL FALLBACK -------- */
      if (!this.listingSource) {
        this.listingSource = "owner"; // only if EVERYTHING fails
      }

      next();
    } catch (err) {
      next(err as any);
    }
  }
);

export const Residential: Model<IResidential> =
  (mongoose.models && (mongoose.models as any)["Residential"]) ||
  mongoose.model<IResidential>("Residential", ResidentialSchema);

export default Residential;

function buildResidentialTitle(doc: any) {
  const bhk = doc.bhk ? `${doc.bhk} BHK` : "";
  const propertyType = doc.propertyType ?? "Residential Property";
  const listingType =
    doc.listingType === "rent"
      ? "Rent"
      : doc.listingType === "lease"
      ? "Lease"
      : "Sale";

  const locality = doc.locality ?? "";
  const city = doc.city ?? "";

  return `${bhk} ${propertyType} for ${listingType}  in ${locality}, ${city}`
    .replace(/\s+/g, " ")
    .trim();
}
