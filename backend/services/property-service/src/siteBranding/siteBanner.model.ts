import mongoose, { Document, Model } from "mongoose";
import { BANNER_SLOT_KEYS, BannerSlot } from "./siteBranding.constants";

const { Schema } = mongoose;

export type SiteBannerLocation = {
  state?: string;
  city?: string;
  locality?: string;
  subLocality?: string;
  /** Sponsored-style map: { [state]: { [city]: localities[] } }. Empty = all India. */
  coverage?: Record<string, Record<string, string[]>>;
};

export type SiteBannerTextBlock = {
  enabled: boolean;
  html: string;
};

/** One device creative — fully separate from other sizes. */
export type SiteBannerDevice = {
  image: string;
  clickUrl: string;
  heading: SiteBannerTextBlock;
  subheading: SiteBannerTextBlock;
  location: SiteBannerLocation;
};

export type SiteBannerDevices = Record<BannerSlot, SiteBannerDevice>;

export interface ISiteBanner extends Document {
  title: string;
  priority: number;
  devices: SiteBannerDevices;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const locationSchema = new Schema(
  {
    state: { type: String, default: "", trim: true },
    city: { type: String, default: "", trim: true },
    locality: { type: String, default: "", trim: true },
    subLocality: { type: String, default: "", trim: true },
    // Same nested shape as promotion.sponsoredAd
    coverage: { type: Schema.Types.Mixed, default: () => ({}) },
  },
  { _id: false },
);

const textBlockSchema = new Schema(
  {
    enabled: { type: Boolean, default: true },
    html: { type: String, default: "", maxlength: 20000 },
  },
  { _id: false },
);

const deviceSchema = new Schema(
  {
    image: { type: String, default: "", trim: true },
    clickUrl: { type: String, default: "", trim: true, maxlength: 2048 },
    heading: {
      type: textBlockSchema,
      default: () => ({ enabled: true, html: "" }),
    },
    subheading: {
      type: textBlockSchema,
      default: () => ({ enabled: true, html: "" }),
    },
    location: {
      type: locationSchema,
      default: () => ({}),
    },
  },
  { _id: false },
);

function emptyDevices() {
  return Object.fromEntries(
    BANNER_SLOT_KEYS.map((slot) => [
      slot,
      {
        image: "",
        clickUrl: "",
        heading: { enabled: true, html: "" },
        subheading: { enabled: true, html: "" },
        location: {
          state: "",
          city: "",
          locality: "",
          subLocality: "",
          coverage: {},
        },
      },
    ]),
  );
}

const devicesSchema = new Schema(
  {
    desktop: { type: deviceSchema, default: () => emptyDevices().desktop },
    laptop: { type: deviceSchema, default: () => emptyDevices().laptop },
    tablet: { type: deviceSchema, default: () => emptyDevices().tablet },
    mobile: { type: deviceSchema, default: () => emptyDevices().mobile },
  },
  { _id: false },
);

const siteBannerSchema = new Schema<ISiteBanner>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    priority: {
      type: Number,
      default: 0,
      min: 0,
      max: 9999,
    },
    devices: {
      type: devicesSchema,
      default: emptyDevices,
    },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

siteBannerSchema.index({ priority: -1, updatedAt: -1 });

export const SiteBanner: Model<ISiteBanner> =
  mongoose.models.SiteBanner ||
  mongoose.model<ISiteBanner>("SiteBanner", siteBannerSchema);

export { emptyDevices };
