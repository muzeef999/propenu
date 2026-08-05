import mongoose from "mongoose";
import Location from "../models/locationModel";
import { geocode } from "../utils/geocode";

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function exactCaseInsensitive(value: string) {
  return { $regex: `^${escapeRegex(value)}$`, $options: "i" };
}

type LocalityLike = {
  name?: string;
  location?: {
    type?: string;
    coordinates?: number[];
  } | null | undefined;
};

function localityKey(locality: LocalityLike) {
  return locality.name?.trim().toLowerCase() || "";
}

function toTitleCase(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\b[a-z]/g, (char) => char.toUpperCase());
}
function hasValidCoordinates(locality: LocalityLike) {
  const coordinates = locality.location?.coordinates;
  if (!Array.isArray(coordinates) || coordinates.length !== 2) return false;

  const lng = Number(coordinates[0]);
  const lat = Number(coordinates[1]);
  return Number.isFinite(lng) && Number.isFinite(lat) && !(lng === 0 && lat === 0);
}

export function mergeDuplicateLocalities<T extends LocalityLike>(localities: T[] = []) {
  const byName = new Map<string, T>();

  for (const locality of localities) {
    const key = localityKey(locality);
    if (!key) continue;

    const trimmedName = locality.name?.trim();
    const normalizedLocality = {
      ...locality,
      ...(trimmedName ? { name: toTitleCase(trimmedName) } : {}),
    } as T;

    const existing = byName.get(key);
    if (!existing) {
      byName.set(key, normalizedLocality);
      continue;
    }

    if (!hasValidCoordinates(existing) && hasValidCoordinates(normalizedLocality)) {
      existing.location = normalizedLocality.location;
    }
  }

  return Array.from(byName.values());
}

function localitiesChanged(before: LocalityLike[] = [], after: LocalityLike[] = []) {
  if (before.length !== after.length) return true;

  return before.some((locality, index) => {
    const next = after[index];
    return locality.name !== next?.name || JSON.stringify(locality.location) !== JSON.stringify(next?.location);
  });
}

async function saveWithMergedLocalities(doc: any) {
  const mergedLocalities = mergeDuplicateLocalities(doc.localities as LocalityLike[]);
  if (localitiesChanged(doc.localities as LocalityLike[], mergedLocalities)) {
    doc.localities = mergedLocalities;
  }

  await doc.save();
  return doc;
}

/* ------------------------------------
   TYPES
------------------------------------ */

export interface CreateLocationPayload {
  city: string;
  state?: string | null;
  category: string;
  locality: {
    name: string;
    location?: {
      type: "Point";
      coordinates: [number, number];
    };
  };
}

export interface UpdateLocationPayload {
  city?: string;
  state?: string | null;
  category?: string;
  locality?: {
    name: string;
    location?: {
      coordinates: [number, number];
    };
  };
}

/* ------------------------------------
   CREATE / UPSERT CITY + LOCALITY
------------------------------------ */
export async function createLocation(payload: CreateLocationPayload) {
  if (!payload.city) throw new Error("city is required");
  if (!payload.category) throw new Error("category is required");

  const cityName = payload.city.trim();
  const stateName: string | null = payload.state?.trim() || null;
  const localityName = payload.locality?.name?.trim()
    ? toTitleCase(payload.locality.name)
    : null;

  let coordinates = payload.locality?.location?.coordinates;

  // Auto-geocode locality when coordinates are missing.
  if (!coordinates && localityName) {
    const geo = await geocode(`${localityName}, ${cityName}`);
    if (!geo) {
      throw new Error("Unable to auto-detect coordinates");
    }
    coordinates = [geo.lng, geo.lat];
  }

  const cityFilter = {
    city: exactCaseInsensitive(cityName),
    ...(stateName === null
      ? { $or: [{ state: null }, { state: "" }, { state: { $exists: false } }] }
      : { state: exactCaseInsensitive(stateName) }),
  };

  const existingCity = await Location.findOne(cityFilter);

  if (existingCity) {
    if (localityName) {
      const localityIndex = existingCity.localities.findIndex(
        (item: any) => localityKey(item) === localityName.toLowerCase()
      );

      if (localityIndex >= 0 && coordinates && existingCity.localities[localityIndex]) {
        existingCity.localities[localityIndex].location = {
          type: "Point",
          coordinates,
        };
      }

      if (localityIndex < 0) {
        existingCity.localities.push({
          name: localityName,
          location: coordinates ? { type: "Point", coordinates } : undefined,
        } as any);
      }
    }

    return saveWithMergedLocalities(existingCity);
  }

  const created = new Location({
    city: cityName,
    state: stateName,
    category: payload.category,
    localities: localityName
      ? [
          {
            name: localityName,
            location: coordinates ? { type: "Point", coordinates } : undefined,
          },
        ]
      : [],
  });

  return saveWithMergedLocalities(created);
}

/* ------------------------------------
   GET ALL CITIES + METADATA
------------------------------------ */
export async function getAllLocationsDetails() {
  const locations = await Location.find()
    .sort({ city: 1 })
    .lean();

  const states = await Location.aggregate([
    { $group: { _id: "$state", count: { $sum: 1 } } },
    { $project: { state: "$_id", count: 1, _id: 0 } },
    { $sort: { state: 1 } },
  ]);

  const categories = await Location.aggregate([
    { $group: { _id: "$category", count: { $sum: 1 } } },
    { $project: { category: "$_id", count: 1, _id: 0 } },
    { $sort: { category: 1 } },
  ]);

  return {
    locations: locations.map((location) => ({
      ...location,
      localities: mergeDuplicateLocalities(location.localities),
    })),
    states,
    categories,
  };
}

/* ------------------------------------
   UPDATE CITY / LOCALITY
------------------------------------ */
export async function updateLocation(
  id: string,
  payload: UpdateLocationPayload
) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error("Invalid id");
  }

  const doc = await Location.findById(id);
  if (!doc) return null;

  if (payload.city !== undefined) {
    doc.city = payload.city;
  }

  if (payload.state !== undefined) {
    doc.set("state", payload.state);
  }

  if (payload.category !== undefined) {
    doc.category = payload.category;
  }

  if (payload.locality) {
    const localityName = toTitleCase(payload.locality.name);
    let coordinates = payload.locality.location?.coordinates;

    if (!coordinates) {
      const geo = await geocode(`${localityName}, ${doc.city}`);
      if (geo) {
        coordinates = [geo.lng, geo.lat];
      }
    }

    if (coordinates) {
      coordinates = [Number(coordinates[0]), Number(coordinates[1])];
    }

    const index = doc.localities.findIndex(
      (l: any) => localityKey(l) === localityName.toLowerCase()
    );

    if (index >= 0 && coordinates && doc.localities[index]) {
      doc.localities[index].location = {
        type: "Point",
        coordinates,
      };
    }
  }

  return saveWithMergedLocalities(doc);
}

/* ------------------------------------
   CLEAN DUPLICATE LOCALITIES
------------------------------------ */
export async function cleanupDuplicateLocalities() {
  const docs = await Location.find();
  const cleanedCities: Array<{
    id: string;
    city: string;
    state: string | null;
    before: number;
    after: number;
    removed: number;
  }> = [];

  for (const doc of docs) {
    const before = doc.localities.length;
    const mergedLocalities = mergeDuplicateLocalities(doc.localities as LocalityLike[]);

    if (!localitiesChanged(doc.localities as LocalityLike[], mergedLocalities)) {
      continue;
    }

    doc.localities = mergedLocalities as any;
    await doc.save();

    cleanedCities.push({
      id: String(doc._id),
      city: doc.city,
      state: doc.state ?? null,
      before,
      after: mergedLocalities.length,
      removed: before - mergedLocalities.length,
    });
  }

  return {
    scanned: docs.length,
    cleaned: cleanedCities.length,
    removed: cleanedCities.reduce((total, item) => total + item.removed, 0),
    cities: cleanedCities,
  };
}

/* ------------------------------------
   DELETE CITY
------------------------------------ */
export async function removeLocation(id: string) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error("Invalid id");
  }
  return Location.findByIdAndDelete(id);
}

/* ------------------------------------
   GET CITY BY ID
------------------------------------ */
export async function getLocationByIdService(id: string) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error("Invalid id");
  }

  const doc = await Location.findById(id).lean();
  if (!doc) return null;

  return {
    ...doc,
    localities: mergeDuplicateLocalities(doc.localities),
  };
}

/* ------------------------------------
   DEL LOCALITY
------------------------------------ */
export async function removeLocalityFromCity(
  cityId: string,
  localityName: string
) {
  if (!mongoose.Types.ObjectId.isValid(cityId)) {
    throw new Error("Invalid id");
  }

  const doc = await Location.findById(cityId).lean();
  if (!doc) return null;

  const localities = [...doc.localities];
  const matchingIndexes = localities
    .map((locality, localityIndex) => ({ locality, localityIndex }))
    .filter(
      ({ locality }) =>
        locality.name.trim().toLowerCase() ===
        localityName.trim().toLowerCase()
    );
  const removeIndex =
    matchingIndexes.length > 0
      ? matchingIndexes[matchingIndexes.length - 1]?.localityIndex
      : undefined;

  if (typeof removeIndex !== "number") {
    return null;
  }

  localities.splice(removeIndex, 1);

  await Location.updateOne(
    { _id: cityId },
    { $set: { localities: mergeDuplicateLocalities(localities) } }
  );

  return Location.findById(cityId);
}