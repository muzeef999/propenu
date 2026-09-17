// src/middlewares/upload.ts
import multer, { FileFilterCallback } from "multer";
import { Request } from "express";

export const upload = multer({

  storage: multer.memoryStorage(),

  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB — CSV / general uploads
  },

  fileFilter: (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    const isContactFile =
      file.originalname.toLowerCase().endsWith(".csv") ||
      file.originalname.toLowerCase().endsWith(".xlsx") ||
      file.originalname.toLowerCase().endsWith(".xls") ||
      file.originalname.toLowerCase().endsWith(".xlsm") ||
      file.originalname.toLowerCase().endsWith(".tsv") ||
      file.originalname.toLowerCase().endsWith(".txt") ||
      file.originalname.toLowerCase().endsWith(".ods") ||
      file.mimetype === "text/csv" ||
      file.mimetype === "text/plain" ||
      file.mimetype === "application/vnd.ms-excel" ||
      file.mimetype ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      file.mimetype === "application/vnd.oasis.opendocument.spreadsheet";

    const isImage = file.mimetype.startsWith("image/");

    if (isContactFile || isImage) {
      cb(null, true);
    } else {
      cb(new Error("Upload CSV, Excel, TSV, TXT, ODS, or an image"));
    }
  },
});

/** Push campaign images only — max 1 MB */
export const uploadNotificationImage = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 1 * 1024 * 1024,
  },
  fileFilter: (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});