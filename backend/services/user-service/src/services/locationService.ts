import mongoose from "mongoose";
import Location from "../models/locationModel";
import { geocode } from "../utils/geocode";

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function exactCaseInsensitive(value: string) {
  return { $regex: `^${escapeRegex(value)}$`, $options: "i" };
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
  const localityName = payload.locality?.name?.trim() || null;

  let coordinates = payload.locality?.location?.coordinates;

  // 🌍 Auto-geocode locality if coordinates exist
  if (!coordinates && localityName) {
    const geo = await geocode(`${localityName}, ${cityName}`);
    if (!geo) {
      throw new Error("Unable to auto-detect coordinates");
    }
    coordinates = [geo.lng, geo.lat];
  }

  const existingCity = await Location.findOne({
    city: exactCaseInsensitive(cityName),
    ...(stateName === null
      ? { $or: [{ state: null }, { state: "" }, { state: { $exists: false } }] }
      : { state: exactCaseInsensitive(stateName) }),
  });

  if (existingCity && localityName) {
    const localityIndex = existingCity.localities.findIndex(
      (item: any) => item.name?.trim().toLowerCase() === localityName.toLowerCase()
    );

    if (localityIndex >= 0) {
      const existingLocality = existingCity.localities[localityIndex];
      if (coordinates) {
        await Location.updateOne(
          {
            _id: existingCity._id,
            "localities.name": existingLocality?.name,
          },
          {
            $set: {
              "localities.$.location": {
                type: "Point",
                coordinates,
              },
            },
          }
        );
      }
      return Location.findById(existingCity._id);
    }

    await Location.updateOne(
      {
        _id: existingCity._id,
        localities: {
          $not: {
            $elemMatch: { name: exactCaseInsensitive(localityName) },
          },
        },
      },
      {
        $push: {
          localities: {
            name: localityName,
            location: coordinates ? { type: "Point", coordinates } : undefined,
          },
        },
      }
    );
    return Location.findById(existingCity._id);
  }

  return Location.findOneAndUpdate(
    {
      city: exactCaseInsensitive(cityName),
      ...(stateName === null
        ? { $or: [{ state: null }, { state: "" }, { state: { $exists: false } }] }
        : { state: exactCaseInsensitive(stateName) }),
    },
    {
      $setOnInsert: {
        city: cityName,
        state: stateName,
        category: payload.category,
      },
      ...(localityName
        ? {
            $addToSet: {
              localities: {
                name: localityName,
                location: coordinates
                  ? { type: "Point", coordinates }
                  : undefined,
              },
            },
          }
        : {}),
    },
    {
      upsert: true,
      new: true,
    }
  );
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
    locations,
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

  // ---- top-level fields ----
  if (payload.city !== undefined) {
    doc.city = payload.city;
  }

if (payload.state !== undefined) {
  doc.set("state", payload.state);
}
  if (payload.category !== undefined) {
    doc.category = payload.category;
  }

  // ---- locality update ----
  if (payload.locality) {
    const localityName = payload.locality.name.trim();
    let coordinates = payload.locality.location?.coordinates;

    // auto-geocode if missing
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
      (l: any) => l.name === localityName
    );

    if (index >= 0 && coordinates && doc.localities[index]) {
      doc.localities[index].location = {
        type: "Point",
        coordinates,
      };
    }
  }

  return doc.save();
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
  return Location.findById(id).lean();
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

  // Remove only one matching locality. $pull removes every duplicate with the same name.
  await Location.updateOne(
    { _id: cityId },
    { $set: { localities } }
  );

  return Location.findById(cityId);
}

