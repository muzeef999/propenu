import { Request, Response } from "express";
import { cleanupDuplicateLocalities, createLocation, getAllLocationsDetails, getLocationByIdService, removeLocalityFromCity, removeLocation, updateLocation } from "../services/locationService";
import mongoose from "mongoose";
import axios from "axios";
import { AuthRequest } from "../middlewares/authMiddleware";

type MajorCity = {
  city: string;
  state: string;
  lat: number;
  lon: number;
};

const MAX_NEAREST_MAJOR_CITY_DISTANCE_KM = 180;

const MAJOR_CITIES: MajorCity[] = [
  { city: "Hyderabad", state: "Telangana", lat: 17.385, lon: 78.4867 },
  { city: "Warangal", state: "Telangana", lat: 17.9689, lon: 79.5941 },
  { city: "Karimnagar", state: "Telangana", lat: 18.4386, lon: 79.1288 },
  { city: "Nizamabad", state: "Telangana", lat: 18.6725, lon: 78.0941 },
  { city: "Khammam", state: "Telangana", lat: 17.2473, lon: 80.1514 },
  { city: "Vijayawada", state: "Andhra Pradesh", lat: 16.5062, lon: 80.648 },
  { city: "Visakhapatnam", state: "Andhra Pradesh", lat: 17.6868, lon: 83.2185 },
  { city: "Guntur", state: "Andhra Pradesh", lat: 16.3067, lon: 80.4365 },
  { city: "Ongole", state: "Andhra Pradesh", lat: 15.5057, lon: 80.0499 },
  { city: "Nellore", state: "Andhra Pradesh", lat: 14.4426, lon: 79.9865 },
  { city: "Tirupati", state: "Andhra Pradesh", lat: 13.6288, lon: 79.4192 },
  { city: "Kurnool", state: "Andhra Pradesh", lat: 15.8281, lon: 78.0373 },
  { city: "Kadapa", state: "Andhra Pradesh", lat: 14.4673, lon: 78.8242 },
  { city: "Rajahmundry", state: "Andhra Pradesh", lat: 17.0005, lon: 81.804 },
  { city: "Kakinada", state: "Andhra Pradesh", lat: 16.9891, lon: 82.2475 },
  { city: "Eluru", state: "Andhra Pradesh", lat: 16.7107, lon: 81.0952 },
  { city: "Anantapur", state: "Andhra Pradesh", lat: 14.6819, lon: 77.6006 },
  { city: "Srikakulam", state: "Andhra Pradesh", lat: 18.2949, lon: 83.8938 },
  { city: "Vizianagaram", state: "Andhra Pradesh", lat: 18.1067, lon: 83.3956 },
  { city: "Machilipatnam", state: "Andhra Pradesh", lat: 16.1875, lon: 81.1389 },
  { city: "Chittoor", state: "Andhra Pradesh", lat: 13.2172, lon: 79.1003 },
];

function toNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function distanceKm(fromLat: number, fromLon: number, toLat: number, toLon: number) {
  const earthRadiusKm = 6371;
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const dLat = toRadians(toLat - fromLat);
  const dLon = toRadians(toLon - fromLon);
  const lat1 = toRadians(fromLat);
  const lat2 = toRadians(toLat);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  return 2 * earthRadiusKm * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function nearestMajorCity(latitude: number, longitude: number) {
  return MAJOR_CITIES.reduce<{ city: MajorCity; distanceKm: number } | null>(
    (nearest, city) => {
      const distance = distanceKm(latitude, longitude, city.lat, city.lon);
      if (!nearest || distance < nearest.distanceKm) {
        return { city, distanceKm: distance };
      }
      return nearest;
    },
    null
  );
}

async function reverseState(latitude: number, longitude: number) {
  try {
    const response = await axios.get("https://nominatim.openstreetmap.org/reverse", {
      params: {
        format: "jsonv2",
        lat: latitude,
        lon: longitude,
        addressdetails: 1,
        zoom: 8,
      },
      headers: {
        Accept: "application/json",
        "Accept-Language": "en",
        "User-Agent": "Propenu/1.0 location detection",
      },
      timeout: 7000,
    });

    const address = response.data?.address ?? {};
    return address.state || address.region || null;
  } catch {
    return null;
  }
}

export const reverseMajorCity = async (req: Request, res: Response) => {
  const latitude = toNumber(req.query.lat);
  const longitude = toNumber(req.query.lon);

  if (latitude === null || longitude === null) {
    return res.status(400).json({ error: "lat and lon are required numbers" });
  }

  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return res.status(400).json({ error: "lat or lon is out of range" });
  }

  const nearest = nearestMajorCity(latitude, longitude);
  const nearestWithinRange =
    nearest && nearest.distanceKm <= MAX_NEAREST_MAJOR_CITY_DISTANCE_KM ? nearest : null;
  const fallbackState = nearestWithinRange ? null : await reverseState(latitude, longitude);

  return res.json({
    city: nearestWithinRange?.city.city ?? null,
    state: nearestWithinRange?.city.state ?? fallbackState,
    distanceKm: nearestWithinRange ? Number(nearestWithinRange.distanceKm.toFixed(1)) : null,
    source: nearestWithinRange ? "major-city-db" : "reverse-geocode",
  });
};
export const postLocation = async (req: Request, res: Response) => {
  try {
    const payload = req.body;

    if (!payload || typeof payload !== "object") {
      return res.status(400).json({ error: "Invalid payload" });
    }

    const { city, category, location, locality } = payload;
    const localityPayload = locality || location;

    if (!city || !category) {
      return res.status(400).json({ error: "city and category are required" });
    }

    // If user manually sends coordinates, validate them
    const coordsSource = localityPayload?.location?.coordinates || localityPayload?.coordinates;
    if (coordsSource) {
      const coords = coordsSource;

      if (!Array.isArray(coords) || coords.length !== 2) {
        return res
          .status(400)
          .json({ error: "coordinates must be [lng, lat]" });
      }

      if (isNaN(Number(coords[0])) || isNaN(Number(coords[1]))) {
        return res
          .status(400)
          .json({ error: "coordinates must be valid numbers" });
      }

      if (localityPayload.location) {
        localityPayload.location.coordinates = [Number(coords[0]), Number(coords[1])];
      }
    }

    const doc = await createLocation({
      ...payload,
      locality: localityPayload,
      isHome:
        payload.isHome === false || payload.isHome === "false" ? false : true,
    });

    return res.status(201).json({ success: true, item: doc });
  } catch (err: any) {
    console.error("postLocation err:", err);
    return res.status(500).json({ error: err.message || "server error" });
  }
};


export const getAllLocations = async(req: AuthRequest, res: Response) => {
  try {
    const roleName = String(req.user?.roleName || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_");
    const permissions = req.user?.permissions || [];
    const canManageLocations =
      roleName === "super_admin" ||
      roleName === "admin" ||
      permissions.includes("location:view") ||
      permissions.includes("location:create") ||
      permissions.includes("location:update") ||
      permissions.includes("location:delete");

    const result = await getAllLocationsDetails({
      homeOnly: !canManageLocations,
    });
    return res.json(result);

  }catch (err: any) {
    return res.status(500).json({ error: err.message || "server error" });
  }
}


export const getLocationById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid id" });
    }

    const item = await getLocationByIdService(id);
    if (!item) return res.status(404).json({ error: "Location not found" });

    return res.json({ success: true, item });
  } catch (err: any) {
    console.error("getLocationById err:", err);
    return res.status(500).json({ error: err.message || "server error" });
  }
};

export const  deleteLocation = async(req:Request, res:Response) => {
  try{

  const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid id" });
    }

    const removed = await removeLocation(id);
    if (!removed) {
      return res.status(404).json({ error: "Location not found" });
    }

    return res.json({ success: true, deletedId: id });

    
  }catch (err:any) {
     return res.status(500).json({ error: err.message || "server error" });
  }
}

export const editLocation = async(req:Request, res:Response) => {
  try {
const { id } = req.params;
       if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid id" });
    }

    const payload = req.body;
    if (!payload || typeof payload !== "object") {
      return res.status(400).json({ error: "Invalid payload" });
    }

     const updated = await updateLocation(id, payload);
    if (!updated) {
      return res.status(404).json({ error: "Location not found" });
    }

        return res.json({ success: true, item: updated });

  } catch(err: any) {
    return res.status(500).json({error: err.message || "server error"});
  }
}

export const deleteLocality = async (req: Request, res: Response) => {
  try {
    const { id, name } = req.params;

    // ✅ STEP 1: Runtime + TypeScript guard
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid city id" });
    }

    if (!name || typeof name !== "string") {
      return res.status(400).json({ error: "Locality name required" });
    }

    // ✅ STEP 2: id & name are now safely `string`
    const updated = await removeLocalityFromCity(id, name);

    if (!updated) {
      return res.status(404).json({ error: "City or locality not found" });
    }

    return res.json({
      success: true,
      message: `Locality '${name}' deleted`,
      item: updated,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "server error" });
  }
};



export const dedupeLocalities = async (_req: Request, res: Response) => {
  try {
    const result = await cleanupDuplicateLocalities();
    return res.json({
      success: true,
      message: "Duplicate localities merged",
      result,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "server error" });
  }
};


