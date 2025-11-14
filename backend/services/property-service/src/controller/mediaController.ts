// src/controllers/propertyController.ts
import { Request, Response } from "express";
import { uploadBufferToS3 } from "../services/mediaService";
import { propertyModel } from "../models/propertyModel";

export async function createProperty(req: Request, res: Response) {
  try {
    // Expect multipart/form-data
    const { title, description, price, category, listingType, details } = req.body;
    if (!title || !category || !listingType) {
      return res.status(400).json({ message: "title, category and listingType are required" });
    }

    let parsedDetails: Record<string, any> = {};
    if (details) {
      try {
        parsedDetails = typeof details === "string" ? JSON.parse(details) : details;
      } catch {
        parsedDetails = {};
      }
    }

    const prop = await propertyModel.create({
      title,
      description,
      price: price ? Number(price) : undefined,
      category,
      listingType,
      details: parsedDetails,
      // userId: req.user?._id  // add auth later
    });

    // If file present, upload to S3 and push into images array in the same Property doc
    const file = (req as any).file as Express.Multer.File | undefined;
    if (file) {
      const { key, url } = await uploadBufferToS3({
        buffer: file.buffer,
        originalname: file.originalname,
        mimetype: file.mimetype,
        propertyId: prop._id!.toString(),
      });

      prop.images = prop.images || [];
      prop.images.push({ url, key, alt: file.originalname, size: file.size } as any);
      await prop.save();
    }

    return res.status(201).json(prop);
  } catch (err: any) {
    console.error(err);
    if (err.message && err.message.includes("Only image files")) {
      return res.status(400).json({ message: err.message });
    }
    return res.status(500).json({ message: "Server error", error: err.message });
  }
}
