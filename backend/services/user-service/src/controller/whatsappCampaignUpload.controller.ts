import { Request, Response } from "express";
import { uploadToS3 } from "../utils/s3Upload";

/**
 * Upload a campaign header image to S3 and return a public URL
 * for Meta WhatsApp template sends.
 */
export const uploadWhatsAppCampaignImage = async (
  req: Request,
  res: Response,
) => {
  try {
    const file = req.file;
    if (!file?.buffer) {
      return res.status(400).json({
        success: false,
        message: "Image file is required",
      });
    }

    if (!String(file.mimetype || "").startsWith("image/")) {
      return res.status(400).json({
        success: false,
        message: "Only image files are allowed",
      });
    }

    const ext =
      (file.originalname || "").includes(".")
        ? `.${file.originalname.split(".").pop()?.toLowerCase()}`
        : "";
    const safeExt = [".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(ext)
      ? ext
      : ".jpg";

    const key = `whatsapp/campaigns/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 9)}${safeExt}`;

    const uploaded = await uploadToS3({
      buffer: file.buffer,
      key,
      mimetype: file.mimetype || "image/jpeg",
    });

    return res.json({
      success: true,
      url: uploaded.url,
      key: uploaded.key,
      message: "Campaign image uploaded",
    });
  } catch (error: any) {
    console.error("❌ WhatsApp campaign image upload failed:", error);
    return res.status(500).json({
      success: false,
      message: error?.message || "Image upload failed",
    });
  }
};
