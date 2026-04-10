// src/middlewares/upload.ts
import multer, { FileFilterCallback } from "multer";
import { Request } from "express";

export const upload = multer({

  storage: multer.memoryStorage(),

  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },

  fileFilter: (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    const isCSV =
      file.mimetype === "text/csv" ||
      file.mimetype === "application/vnd.ms-excel" ||
      file.originalname.toLowerCase().endsWith(".csv");

    const isImage = file.mimetype.startsWith("image/");

    if (isCSV || isImage) {
      cb(null, true);
    } else {
      cb(new Error("Only CSV and image files are allowed"));
    }
  },
});