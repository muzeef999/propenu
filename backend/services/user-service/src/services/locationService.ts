import mongoose from "mongoose";
import Location from "../models/locationModel";
import { geocode } from "../utils/geocode";

export interface LocationItem {
  _id: string; // MongoDB ObjectId
  name: string;
  state: string;
  category: string;
  location: {
    type: "Point";
    coordinates: [number, number]; // [longitude, latitude]
  };
  createdAt: string;
  updatedAt: string;
  __v: number;
}


export async function createLocation(payload: LocationItem) {
  let data = { ...payload };

  // ⭐ Auto-geocode ONLY if coordinates not provided
  if (!data.location || !data.location.coordinates) {
    const geo = await geocode(data.name);

    if (!geo) {
      throw new Error("Unable to auto-detect coordinates");
    }

    data.location = {
      type: "Point",
      coordinates: [geo.lng, geo.lat]
    };
  } else {
    // ensure numeric
    const [lng, lat] = data.location.coordinates;
    data.location.coordinates = [Number(lng), Number(lat)];
  }

  const doc = new Location(data);
  return doc.save();
}


export async function getAllLocationsDetails() {
  const locations = await Location.find().sort({ name: 1 }).lean();

  const states = await Location.aggregate([
    { $group: { _id: "$state", count: { $sum: 1 } } },
    { $project: { state: "$_id", count: 1, _id: 0 } },
    { $sort: { state: 1 } }
  ]);

  const categories = await Location.aggregate([
    { $group: { _id: "$category", count: { $sum: 1 } } },
    { $project: { category: "$_id", count: 1, _id: 0 } },
    { $sort: { category: 1 } }
  ]);

  return {
    locations,
    states,
    categories
  };
}

export async function updateLocation(id: string, payload: LocationItem) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error("Invalid id");
  }
  const doc = await Location.findById(id);
  if (!doc) return null;

  const nameChanged = payload.name && payload.name !== doc.name;

  if (payload.location?.coordinates) {
    const coords = payload.location.coordinates;
    if (!Array.isArray(coords) || coords.length !== 2) {
      throw new Error("coordinates must be [lng, lat]");
    }
    if (isNaN(Number(coords[0])) || isNaN(Number(coords[1]))) {
      throw new Error("coordinates must be valid numbers");
    }
    doc.location = {
      type: "Point",
      coordinates: [Number(coords[0]), Number(coords[1])],
    };
  } else if (nameChanged && !payload.location) {
  
    const geo = await geocode(payload.name as string);
    if (geo) {
      doc.location = {
        type: "Point",
        coordinates: [geo.lng, geo.lat],
      };
    }
}

  if (payload.name !== undefined) doc.name = payload.name;
  if (payload.state !== undefined) doc.state = payload.state ?? null;
  if (payload.category !== undefined) doc.category = payload.category;

  return doc.save();
}

export async function removeLocation(id: string) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error("Invalid id");
  }
  const doc = await Location.findByIdAndDelete(id);
  return doc;
}


export async function getLocationByIdService(id: string) {
  if (!mongoose.Types.ObjectId.isValid(id)) throw new Error("Invalid id");
  return Location.findById(id).lean();
}


