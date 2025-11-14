import multer from "multer";
import { Request, Response, NextFunction } from "express";

/** ✅ Hardcoded MIME types */
const IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
];
const VIDEO_MIME_TYPES = [
  "video/mp4",
  "video/mpeg",
  "video/quicktime",
  "video/webm",
  "video/x-msvideo",
];

/** ✅ Per-file max sizes */
const IMAGE_MAX_BYTES = 1 * 1024 * 1024; // 1MB
const VIDEO_MAX_BYTES = 50 * 1024 * 1024; // 50MB

/** ✅ Multer setup (memory storage for S3 upload) */
const memory = multer.memoryStorage();

const upload = multer({
  storage: memory,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB hard global limit
});

/**
 * ✅ Unified upload middleware:
 * - Accepts multiple images and videos (fields: `images`, `videos`)
 * - Validates MIME type and per-file size
 */
export const uploadMedia = (req: Request, res: Response, next: NextFunction) => {
  const handler = upload.fields([
    { name: "images", maxCount: 12 },
    { name: "videos", maxCount: 6 },
  ]);

  handler(req, res, (err: any) => {
    if (err) {
      console.error("❌ Multer parsing error:", err);
      return res.status(400).json({ success: false, message: err.message });
    }

    const files = req.files as { [field: string]: Express.Multer.File[] } | undefined;

    /** ✅ Validate images */
    const allImages = files?.images || [];
    for (const f of allImages) {
      if (!IMAGE_MIME_TYPES.includes(f.mimetype)) {
        return res.status(400).json({
          success: false,
          message: `Invalid image type: ${f.originalname} (${f.mimetype})`,
        });
      }

      if (f.size > IMAGE_MAX_BYTES) {
        return res.status(400).json({
          success: false,
          message: `Image too large: ${f.originalname} (${Math.round(
            f.size / 1024
          )} KB). Max ${Math.round(IMAGE_MAX_BYTES / 1024)} KB allowed.`,
        });
      }
    }

    /** ✅ Validate videos */
    const allVideos = files?.videos || [];
    for (const f of allVideos) {
      if (!VIDEO_MIME_TYPES.includes(f.mimetype)) {
        return res.status(400).json({
          success: false,
          message: `Invalid video type: ${f.originalname} (${f.mimetype})`,
        });
      }

      if (f.size > VIDEO_MAX_BYTES) {
        return res.status(400).json({
          success: false,
          message: `Video too large: ${f.originalname} (${Math.round(
            f.size / 1024 / 1024
          )} MB). Max ${Math.round(VIDEO_MAX_BYTES / 1024 / 1024)} MB allowed.`,
        });
      }
    }

    /** ✅ Everything passed */
    next();
  });
};
