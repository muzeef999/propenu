// src/controllers/nominatimController.ts
import { Request, Response } from "express";
import {
  searchLocations,
  reverseLocation,
  nearbyCities,
} from "../services/nominatimService";

export const nominatimController = {
  async search(req: Request, res: Response) {
    try {
      const q = (req.query.q as string) || "";
      const limit = req.query.limit ? Number(req.query.limit) : 5;
      if (!q) return res.status(400).json({ error: "q query param required" });
      const items = await searchLocations(q, limit);
      return res.json({ query: q, count: items.length, items });
    } catch (err: any) {
      console.error("search error:", err);
      return res.status(500).json({ error: err.message || "internal error" });
    }
  },

  async reverse(req: Request, res: Response) {
    try {
      const lat = Number(req.query.lat);
      const lon = Number(req.query.lon);
      if (Number.isNaN(lat) || Number.isNaN(lon)) {
        return res
          .status(400)
          .json({ error: "lat and lon query params required (numbers)" });
      }
      const r = await reverseLocation(lat, lon);
      if (!r) return res.status(404).json({ error: "not found" });
      return res.json(r);
    } catch (err: any) {
      console.error("reverse error:", err);
      return res.status(500).json({ error: err.message || "internal error" });
    }
  },

  // GET /api/nominatim/nearby?lat=..&lon=..&radius=100&limit=20
  async nearbyByCoords(req: Request, res: Response) {
    try {
      const lat = Number(req.query.lat);
      const lon = Number(req.query.lon);
      const radiusKm = req.query.radius ? Number(req.query.radius) : 100;
      const limit = req.query.limit ? Number(req.query.limit) : 50;

      if (Number.isNaN(lat) || Number.isNaN(lon)) {
        return res
          .status(400)
          .json({ error: "lat and lon query params required (numbers)" });
      }

      const places = await nearbyCities(lat, lon, radiusKm, limit);
      return res.json({
        center: { lat, lon },
        radiusKm,
        count: places.length,
        places,
      });
    } catch (err: any) {
      console.error("nearbyByCoords error:", err);
      return res.status(500).json({ error: err.message || "internal error" });
    }
  },

  // GET /api/nominatim/nearby-by-city?q=Pune&radius=100&limit=20
  async nearbyByCity(req: Request, res: Response) {
    try {
      const q = (req.query.q as string) || "";
      const radiusKm = req.query.radius ? Number(req.query.radius) : 100;
      const limit = req.query.limit ? Number(req.query.limit) : 50;

      if (!q)
        return res
          .status(400)
          .json({ error: "q query param (city name) is required" });

      const searchRes = await searchLocations(q, 1);
      if (!searchRes.length)
        return res.status(404).json({ error: "city not found" });

      const center = searchRes[0];
      if (!center)
        return res.status(404).json({ error: "city not found" });

      const places = await nearbyCities(
        center.lat,
        center.lon,
        radiusKm,
        limit
      );

      return res.json({
        query: q,
        center,
        radiusKm,
        count: places.length,
        places,
      });
    } catch (err: any) {
      console.error("nearbyByCity error:", err);
      return res.status(500).json({ error: err.message || "internal error" });
    }
  },
};
