import { Request, Response } from "express";
import { reverseLocation, searchLocations } from "../services/nominatimService";

export const nominatimController = {
  async search(req: Request, res: Response) {
    try {
      const q = String(req.query.q || "").trim();
      if (!q) return res.json([]);
      const limit = Number(req.query.limit || 5);
      const results = await searchLocations(q, limit);
      res.json(results);
    } catch (err) {
      res.status(500).json({ error: "Search failed" });
    }
  },

  async reverse(req: Request, res: Response) {
    try {
      const lat = Number(req.query.lat);
      const lon = Number(req.query.lon);
      if (!lat || !lon) return res.status(400).json({ error: "lat & lon required" });
      const result = await reverseLocation(lat, lon);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: "Reverse failed" });
    }
  },
};
