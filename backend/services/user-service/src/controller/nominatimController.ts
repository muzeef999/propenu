import { Request, Response } from "express";
import { createLocation, getAllLocationsDetails, getLocationByIdService, removeLocation, updateLocation } from "../services/locationService";
import { error } from "console";
import mongoose from "mongoose";

export const postLocation = async (req: Request, res: Response) => {
  try {
    const payload = req.body;

    if (!payload || typeof payload !== "object") {
      return res.status(400).json({ error: "Invalid payload" });
    }

    const { name, category, location } = payload;

    if (!name || !category) {
      return res.status(400).json({ error: "name and category are required" });
    }

    // If user manually sends coordinates, validate them
    if (location?.coordinates) {
      const coords = location.coordinates;

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

      payload.location.coordinates = [Number(coords[0]), Number(coords[1])];
    }

    const doc = await createLocation(payload);

    return res.status(201).json({ success: true, item: doc });
  } catch (err: any) {
    console.error("postLocation err:", err);
    return res.status(500).json({ error: err.message || "server error" });
  }
};


export const getAllLocations = async(req:Request, res:Response) => {
  try {
    const result = await getAllLocationsDetails();
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
