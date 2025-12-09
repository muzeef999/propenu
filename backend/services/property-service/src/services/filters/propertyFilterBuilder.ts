// src/services/propertyFilterBuilder.ts (or wherever buildBaseFilters lives)

import { Request } from "express";
import mongoose from "mongoose";
import parseNumber from "../../utils/parseNumber";
import { BaseFilters } from "../../types/filterTypes";

export type FilterOptions = {
  sort?: any;
  skip?: number;
  limit?: number;
  projection?: any;
};

export type BuildBaseResult = {
  filter: any;
  options: FilterOptions;
};

export function buildBaseFilters(req: Request): BuildBaseResult {
  const q = (req.query.q as string | undefined)?.trim();
  const city = (req.query.city as string | undefined)?.trim();
  const state = (req.query.state as string | undefined)?.trim();
  const pincode = (req.query.pincode as string | undefined)?.trim();
  const listingType = (req.query.listingType as string | undefined)?.trim();
  const listingSource = (req.query.listingSource as string | undefined)?.trim();
  const status = (req.query.status as string | undefined)?.trim();
  const createdBy = (req.query.createdBy as string | undefined)?.trim();

  const minPrice = parseNumber(req.query.minPrice as unknown as string);
  const maxPrice = parseNumber(req.query.maxPrice as unknown as string);
  const minPricePerSqft = parseNumber(req.query.minPricePerSqft as unknown as string);
  const maxPricePerSqft = parseNumber(req.query.maxPricePerSqft as unknown as string);

  const page = Math.max(1, Number(req.query.page ?? 1));
  const limit = Math.max(1, Math.min(100, Number(req.query.limit ?? 20)));
  const skip = (page - 1) * limit;

  const sortBy = (req.query.sortBy as string | undefined) ?? "createdAt";
  const sortOrder = (req.query.sortOrder as string | undefined) === "asc" ? 1 : -1;

  const filter: any = {};

  if (q) {
    filter.$text = { $search: q };
  }

  if (city) filter.city = city;
  if (state) filter.state = state;
  if (pincode) filter.pincode = pincode;
  if (listingType) filter.listingType = listingType;
  if (listingSource) filter.listingSource = listingSource;
  if (status) filter.status = status;
  if (createdBy && mongoose.Types.ObjectId.isValid(createdBy))
    filter.createdBy = new mongoose.Types.ObjectId(createdBy);

  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.price = {};
    if (minPrice !== undefined) filter.price.$gte = minPrice;
    if (maxPrice !== undefined) filter.price.$lte = maxPrice;
  }

  if (minPricePerSqft !== undefined || maxPricePerSqft !== undefined) {
    filter.pricePerSqft = {};
    if (minPricePerSqft !== undefined) filter.pricePerSqft.$gte = minPricePerSqft;
    if (maxPricePerSqft !== undefined) filter.pricePerSqft.$lte = maxPricePerSqft;
  }

  // Geo-near support
  if (typeof req.query.near === "string") {
    const parts = req.query.near.split(",").map((s) => s.trim());
    if (parts.length === 2) {
      const lng = Number(parts[0]);
      const lat = Number(parts[1]);
      const maxDistance = parseNumber(req.query.maxDistance as unknown as string) ?? 5000;
      if (!Number.isNaN(lng) && !Number.isNaN(lat)) {
        filter.location = {
          $nearSphere: {
            $geometry: { type: "Point", coordinates: [lng, lat] },
            $maxDistance: maxDistance,
          },
        };
      }
    }
  }

  const options: FilterOptions = { sort: { [sortBy]: sortOrder }, skip, limit };

  return { filter, options };
}
