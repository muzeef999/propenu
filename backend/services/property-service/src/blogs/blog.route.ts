import express from "express";
import type { NextFunction, Request, Response } from "express";
import multer from "multer";
import {
  createBlog,
  deleteBlog,
  getBlogById,
  getBlogBySlug,
  getBlogs,
  likeBlog,
  shareBlog,
  updateBlog,
} from "./blog.controller";
import { authMiddleware } from "../middlewares/authMiddleware";
import { requirePermission } from "../middlewares/requirePermission";
import { parseJsonFields } from "../middlewares/parseJsonFields";
import { uploadFile } from "../utils/uploadFile";
import { validateCreateBlog, validateUpdateBlog } from "./blog.validation";

const router = express.Router();

const imageMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
]);

const blogImageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!imageMimeTypes.has(file.mimetype)) {
      return cb(new Error(`Invalid image type: ${file.mimetype}`));
    }

    return cb(null, true);
  },
});

const blogJsonFields = [
  "author",
  "tags",
  "articleSections",
  "faqs",
  "metaKeywords",
];

function uploadBlogFeaturedImage(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const handler = blogImageUpload.single("featuredImage");

  handler(req, res, async (err: any) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || "Featured image upload failed",
      });
    }

    try {
      if (req.file) {
        const uploaded = await uploadFile({
          buffer: req.file.buffer,
          originalName: req.file.originalname,
          mimetype: req.file.mimetype,
          folder: "blogs/featured-images",
        });

        req.body.featuredImage = uploaded.url;
      }

      return next();
    } catch (uploadError: any) {
      console.error("Blog featured image upload failed:", uploadError);
      return res.status(500).json({
        success: false,
        message: uploadError.message || "Featured image upload failed",
      });
    }
  });
}

router.get("/", getBlogs);
router.get("/slug/:slug", getBlogBySlug);
router.get("/:id", getBlogById);

router.post(
  "/",
  authMiddleware,
  requirePermission("blog:create"),
  uploadBlogFeaturedImage,
  parseJsonFields(blogJsonFields),
  validateCreateBlog,
  createBlog,
);
router.post("/:id/like", likeBlog);
router.post("/:id/share", shareBlog);
router.patch(
  "/:id",
  authMiddleware,
  requirePermission("blog:edit"),
  uploadBlogFeaturedImage,
  parseJsonFields(blogJsonFields),
  validateUpdateBlog,
  updateBlog,
);
router.delete("/:id", authMiddleware, requirePermission("blog:delete"), deleteBlog);

export default router;
