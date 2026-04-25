import { Request, Response } from "express";
import { getSponsoredProperties } from "./sponsored.service";

export const getSponsored = async (req: Request, res: Response) => {
  try {
    const data = await getSponsoredProperties(req.query);

    res.json({
      success: true,
      data
    });
  } catch (err) {
    console.error("❌ Sponsored Error:", err);
    res.status(500).json({ message: "Failed to fetch sponsored" });
  }
};