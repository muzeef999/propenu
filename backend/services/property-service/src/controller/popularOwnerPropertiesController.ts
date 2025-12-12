// src/controller/popularOwnerPropertiesController.ts

import { Request, Response } from "express";
import { getPopularOwnerPropertiesByCity } from "../services/popularOwnerPropertieServices";

export const getPropertiesByOwner = async (req: Request, res: Response) => {
  try {
    const city = typeof req.query.city === "string" ? req.query.city.trim() : "";

    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Number(req.query.limit) : 20;

    const result = await getPopularOwnerPropertiesByCity(city, page, limit);

    return res.json(result);
  } catch (err: any) {
    console.error("getPropertiesByOwner:", err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
};
