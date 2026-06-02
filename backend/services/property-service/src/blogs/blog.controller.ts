import { Request, Response } from "express";
import { BlogService } from "./blog.services";
import type { BlogQueryOptions } from "./blog.services";

function parseBoolean(value: unknown) {
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

export const createBlog = async (req: Request, res: Response) => {
  try {
    const blog = await BlogService.createBlog(req.body);
    return res.status(201).json({ data: blog });
  } catch (err: any) {
    if (err?.code === 11000) {
      return res.status(409).json({ message: "Blog title or slug already exists" });
    }

    console.error("createBlog:", err);
    return res.status(500).json({ message: err.message || "Internal server error" });
  }
};

export const getBlogs = async (req: Request, res: Response) => {
  try {
    const { page, limit, q, category, tag, published, featured, sortBy, sortOrder } =
      req.query;

    const options: BlogQueryOptions = {
      sortOrder: sortOrder === "asc" ? "asc" : "desc",
    };

    if (typeof page === "string") options.page = Number(page);
    if (typeof limit === "string") options.limit = Number(limit);
    if (typeof q === "string") options.q = q;
    if (typeof category === "string") options.category = category;
    if (typeof tag === "string") options.tag = tag;
    if (typeof sortBy === "string") options.sortBy = sortBy;

    const parsedPublished = parseBoolean(published);
    const parsedFeatured = parseBoolean(featured);
    if (parsedPublished !== undefined) options.published = parsedPublished;
    if (parsedFeatured !== undefined) options.featured = parsedFeatured;

    const result = await BlogService.getBlogs(options);

    return res.json(result);
  } catch (err: any) {
    console.error("getBlogs:", err);
    return res.status(500).json({ message: err.message || "Internal server error" });
  }
};

export const getBlogById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: "Missing blog id" });

    const blog = await BlogService.getBlogById(id);
    if (!blog) return res.status(404).json({ message: "Blog not found" });

    return res.json({ data: blog });
  } catch (err: any) {
    console.error("getBlogById:", err);
    return res.status(500).json({ message: err.message || "Internal server error" });
  }
};

export const getBlogBySlug = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    if (!slug) return res.status(400).json({ message: "Missing blog slug" });

    const blog = await BlogService.getBlogBySlug(slug);
    if (!blog) return res.status(404).json({ message: "Blog not found" });

    BlogService.incrementViews((blog as any)._id.toString()).catch((err) =>
      console.error("increment blog views:", err),
    );

    return res.json({ data: blog });
  } catch (err: any) {
    console.error("getBlogBySlug:", err);
    return res.status(500).json({ message: err.message || "Internal server error" });
  }
};

export const updateBlog = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: "Missing blog id" });

    const blog = await BlogService.updateBlog(id, req.body);
    if (!blog) return res.status(404).json({ message: "Blog not found" });

    return res.json({ data: blog });
  } catch (err: any) {
    if (err?.code === 11000) {
      return res.status(409).json({ message: "Blog title or slug already exists" });
    }

    console.error("updateBlog:", err);
    return res.status(500).json({ message: err.message || "Internal server error" });
  }
};

export const deleteBlog = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: "Missing blog id" });

    const blog = await BlogService.deleteBlog(id);
    if (!blog) return res.status(404).json({ message: "Blog not found" });

    return res.json({ message: "Blog deleted successfully" });
  } catch (err: any) {
    console.error("deleteBlog:", err);
    return res.status(500).json({ message: err.message || "Internal server error" });
  }
};

export const likeBlog = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: "Missing blog id" });

    const blog = await BlogService.incrementLikes(id);
    if (!blog) return res.status(404).json({ message: "Blog not found" });

    return res.json({ data: blog });
  } catch (err: any) {
    console.error("likeBlog:", err);
    return res.status(500).json({ message: err.message || "Internal server error" });
  }
};

export const shareBlog = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: "Missing blog id" });

    const blog = await BlogService.incrementShares(id);
    if (!blog) return res.status(404).json({ message: "Blog not found" });

    return res.json({ data: blog });
  } catch (err: any) {
    console.error("shareBlog:", err);
    return res.status(500).json({ message: err.message || "Internal server error" });
  }
};
