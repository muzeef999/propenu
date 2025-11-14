import express, { Request, Response } from "express";
import { uploadMedia } from "../middlewares/multer";
import { uploadBufferToS3 } from "../services/mediaService";
import { propertyModel, PropertyDocument } from "../models/propertyModel";

const PropertiesRoute = express.Router();

PropertiesRoute.post("/", uploadMedia, async (req: Request, res: Response) => {
  try {
    const { title, description, userId, listingType,  category,  price,  facing,  area,  address, amenities,  details,    } = req.body;

    if (!title || !listingType || !category) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }
    // Parse JSON safely
    const parsedAddress = address ? JSON.parse(address) : undefined;
    const parsedAmenities = amenities ? JSON.parse(amenities) : undefined;
    const parsedDetails = details ? JSON.parse(details) : undefined;

    /** ✅ Create the property document (typed) */
    const newProperty = (await propertyModel.create({
      title, description, userId, listingType, category,  price: price ? Number(price) : undefined, facing, area: area ? Number(area) : undefined,      address: parsedAddress,  amenities: parsedAmenities,details: parsedDetails, images: [],videos: [],
      })) as PropertyDocument;

    const files = req.files as { [field: string]: Express.Multer.File[] } | undefined;

    if (files?.images?.length) {
      for (const file of files.images) {
        const { key, url } = await uploadBufferToS3({
          buffer: file.buffer,
          originalname: file.originalname,
          mimetype: file.mimetype,
          propertyId: String(newProperty._id),
        });

        newProperty.images.push({
          url,
          key,
          alt: file.originalname,
          size: file.size,
        });
      }
    }

    if (files?.videos?.length) {
      for (const file of files.videos) {
        const { key, url } = await uploadBufferToS3({
          buffer: file.buffer,
          originalname: file.originalname,
          mimetype: file.mimetype,
          propertyId: String(newProperty._id),
        });

        newProperty.videos.push({
          url,
          key,
          alt: file.originalname,
          size: file.size,
        });
      }
    }

    await newProperty.save();

    return res.status(201).json({
      success: true,
      message: "✅ Property created successfully",
      property: newProperty,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message || "Server error",
    });
  }
});


PropertiesRoute.get('/', async(req : Request, res: Response) => {
    try {
      const  properties  =  await propertyModel.find().sort({createdAt:-1});
       return res.status(201).json({
      success: true,
      message: "Property created successfully",
            count: properties.length,
     properties
    });
      }catch(error:any) {
return res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
    }
});


export default PropertiesRoute;
