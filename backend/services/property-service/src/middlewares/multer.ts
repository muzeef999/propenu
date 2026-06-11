// import multer from "multer";
// import { Request, Response, NextFunction } from "express";

// /** ✅ Hardcoded MIME types */
// const IMAGE_MIME_TYPES = [
//   "image/jpeg",
//   "image/png",
//   "image/webp",
//   "image/avif",
//   "image/gif",
// ];
// const VIDEO_MIME_TYPES = [
//   "video/mp4",
//   "video/mpeg",
//   "video/quicktime",
//   "video/webm",
//   "video/x-msvideo",
// ];

// /** ✅ Per-file max sizes */
// const IMAGE_MAX_BYTES = 2 * 1024 * 1024; // 1MB
// const VIDEO_MAX_BYTES = 20 * 1024 * 1024; // 20MB
// const MAX_TOTAL_SIZE = 80 * 1024 * 1024;

// /** ✅ Multer setup (memory storage for S3 upload) */
// const memory = multer.memoryStorage();

// const upload = multer({
//   storage: memory,
//   limits: { fileSize: 100 * 1024 * 1024 }, // 100MB hard global limit
// });

// /**
//  * ✅ Unified upload middleware:
//  * - Accepts multiple images and videos (fields: `images`, `videos`)
//  * - Validates MIME type and per-file size
//  */
// export const uploadMedia = (req: Request, res: Response, next: NextFunction) => {
//   const handler = upload.fields([
//     { name: "images", maxCount: 12 },
//     { name: "videos", maxCount: 3 },
//   ]);

//   handler(req, res, (err: any) => {
//     if (err) {
//       console.error("❌ Multer parsing error:", err);
//       return res.status(400).json({ success: false, message: err.message });
//     }

//     const files = req.files as { [field: string]: Express.Multer.File[] } | undefined;

//     /** ✅ Validate images */
//     const allImages = files?.images || [];
//     for (const f of allImages) {
//       if (!IMAGE_MIME_TYPES.includes(f.mimetype)) {
//         return res.status(400).json({
//           success: false,
//           message: `Invalid image type: ${f.originalname} (${f.mimetype})`,
//         });
//       }

//       if (f.size > IMAGE_MAX_BYTES) {
//         return res.status(400).json({
//           success: false,
//           message: `Image too large: ${f.originalname} (${Math.round(
//             f.size / 1024
//           )} KB). Max ${Math.round(IMAGE_MAX_BYTES / 1024)} KB allowed.`,
//         });
//       }
//     }

//     /** ✅ Validate videos */
//     const allVideos = files?.videos || [];
//     for (const f of allVideos) {
//       if (!VIDEO_MIME_TYPES.includes(f.mimetype)) {
//         return res.status(400).json({
//           success: false,
//           message: `Invalid video type: ${f.originalname} (${f.mimetype})`,
//         });
//       }

//       if (f.size > VIDEO_MAX_BYTES) {
//         return res.status(400).json({
//           success: false,
//           message: `Video too large: ${f.originalname} (${Math.round(
//             f.size / 1024 / 1024
//           )} MB). Max ${Math.round(VIDEO_MAX_BYTES / 1024 / 1024)} MB allowed.`,
//         });
//       }
//     }

//     /** ✅ Everything passed */
//     next();
//   });
// };

import multer from "multer";
import path from "path";
import fs from "fs";
import { Request, Response, NextFunction } from "express";

/* =========================
   Create folders if missing
========================= */

const imageDir = path.join(process.cwd(), "uploads/images");
const videoDir = path.join(process.cwd(), "uploads/videos");

if (!fs.existsSync(imageDir)) {
  fs.mkdirSync(imageDir, { recursive: true });
}

if (!fs.existsSync(videoDir)) {
  fs.mkdirSync(videoDir, { recursive: true });
}

/* =========================
   MIME TYPES
========================= */

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

/* =========================
   LIMITS
========================= */

const IMAGE_MAX_BYTES = 2 * 1024 * 1024;
const VIDEO_MAX_BYTES = 20 * 1024 * 1024;
const MAX_TOTAL_SIZE = 80 * 1024 * 1024;

/* =========================
   STORAGE
========================= */

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (IMAGE_MIME_TYPES.includes(file.mimetype)) {
      cb(null, imageDir);
    } else {
      cb(null, videoDir);
    }
  },

  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);

    const fileName = Date.now() + "-" + Math.round(Math.random() * 1e9) + ext;

    cb(null, fileName);
  },
});

/* =========================
   MULTER
========================= */

const upload = multer({
  storage,
  limits: {
    files: 15,
    fileSize: VIDEO_MAX_BYTES,
  },
});

/* =========================
   MIDDLEWARE
========================= */

export const uploadMedia = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const handler = upload.fields([
    { name: "images", maxCount: 12 },
    { name: "videos", maxCount: 3 },
    { name: "heroImage", maxCount: 1 },
    { name: "logo", maxCount: 1 },
    { name: "aboutImage", maxCount: 1 },
    { name: "brochure", maxCount: 1 },
    { name: "galleryFiles", maxCount: 50 },
    { name: "bhkPlanFiles", maxCount: 50 },
    {name:"verificationDocuments", maxCount: 5}
  ]);

  handler(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }

    if (err) {
      return res.status(400).json({
        success: false,
        message: "Upload failed",
      });
    }

    const files =
      (req.files as {
        [field: string]: Express.Multer.File[];
      }) || {};

    const images = files.images || [];
    const videos = files.videos || [];

    const totalSize = [...images, ...videos].reduce(
      (sum, file) => sum + file.size,
      0,
    );

    if (totalSize > MAX_TOTAL_SIZE) {
      return res.status(400).json({
        success: false,
        message: "Total upload size exceeded 80MB",
      });
    }

    next();
  });
};
