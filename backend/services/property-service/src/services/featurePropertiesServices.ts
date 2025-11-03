
import mongoose from "mongoose";
import { CreateFeaturePropertyDTO, UpdateFeaturePropertyDTO } from "../zod/validation";
import FeaturedProject from "../models/featurePropertiesModel";

export const FeaturePropertyService = {
  async createFeatureProperty(payload: CreateFeaturePropertyDTO) {
    const doc = await FeaturedProject.create(payload);
    return doc;
  },

  async getFeatureById(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new Error("Invalid id");
    const doc = await FeaturedProject.findById(id).populate("gallery").exec();
    return doc;
  },

  async getAllFeatures(options?: {
    page?: number;
    limit?: number;
    q?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }) {
    const page = Math.max(1, options?.page ?? 1);
    const limit = Math.min(100, options?.limit ?? 20);
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (options?.q) {
      // text search
      filter.$text = { $search: options.q };
    }
    if (options?.status) filter.status = options.status;

    const sort: any = {};
    if (options?.sortBy) {
      sort[options.sortBy] = options.sortOrder === "asc" ? 1 : -1;
    } else {
      sort.createdAt = -1;
    }

    const [items, total] = await Promise.all([
      FeaturedProject.find(filter).sort(sort).skip(skip).limit(limit).exec(),
      FeaturedProject.countDocuments(filter).exec(),
    ]);

    return {
      items,
      meta: { total, page, limit, pages: Math.ceil(total / limit) },
    };
  },

  async updateFeatureProperty(id: string, payload: UpdateFeaturePropertyDTO) {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new Error("Invalid id");
    const updated = await FeaturedProject.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
    }).exec();
    return updated;
  },

  async deleteFeatureProperty(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new Error("Invalid id");
    const deleted = await FeaturedProject.findByIdAndDelete(id).exec();
    return deleted;
  },

  // optional: increment views or meta counters
  async incrementViews(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new Error("Invalid id");
    await FeaturedProject.findByIdAndUpdate(id, { $inc: { "meta.views": 1 } }).exec();
  },
};
