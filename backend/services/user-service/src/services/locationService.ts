import Location from "../models/locationModel";
import { geocode } from "../utils/geocode";

export interface CreatePayload {
  name: string;
  state?: string | null;
  category: string;
  location?: { type?: string; coordinates: [number, number] };
} 

export async function createLocation(payload: CreatePayload) {
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