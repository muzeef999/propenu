import express from "express";
import {
  createBlog,
  deleteBlog,
  getBlogById,
  getBlogBySlug,
  getBlogs,
  updateBlog,
} from "./blog.controller";
import { authMiddleware } from "../middlewares/authMiddleware";
import { validateCreateBlog, validateUpdateBlog } from "./blog.validation";

const router = express.Router();

router.get("/", getBlogs);
router.get("/slug/:slug", getBlogBySlug);
router.get("/:id", getBlogById);

router.post("/", authMiddleware, validateCreateBlog, createBlog);
router.patch("/:id", authMiddleware, validateUpdateBlog, updateBlog);
router.delete("/:id", authMiddleware, deleteBlog);

export default router;
