import mongoose from "mongoose";
import Location from "../models/locationModel";
import { geocode } from "../utils/geocode";

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
    city: cityName,
    state: stateName,
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
      { _id: existingCity._id },
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
      city: cityName,
      state: stateName,
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

  const index = doc.localities.findIndex(
    (l) => l.name.toLowerCase() === localityName.toLowerCase()
  );

  // ❌ locality not found
  if (index === -1) {
    return null;
  }

  // ✅ remove ONLY that locality
  await Location.updateOne(
    { _id: cityId },
    {
      $pull: {
        localities: {
          name: { $regex: `^${localityName.trim()}$`, $options: "i" },
        },
      },
    }
  );

  return Location.findById(cityId);
}
