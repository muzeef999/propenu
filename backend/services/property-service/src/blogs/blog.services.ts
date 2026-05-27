import mongoose, { FilterQuery, SortOrder } from "mongoose";
import Blog from "./blog.model";

export type BlogQueryOptions = {
  page?: number;
  limit?: number;
  q?: string;
  category?: string;
  tag?: string;
  published?: boolean;
  featured?: boolean;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};

const allowedSortFields = new Set([
  "createdAt",
  "updatedAt",
  "publishedAt",
  "views",
  "title",
  "readTime",
]);

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function toSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function normalizeTags(tags: unknown) {
  if (!Array.isArray(tags)) return [];
  return tags
    .map((tag) => String(tag).trim())
    .filter(Boolean);
}

function withPublishDate(payload: Record<string, any>) {
  const next = { ...payload };

  if (!next.slug && next.title) {
    next.slug = toSlug(next.title);
  } else if (next.slug) {
    next.slug = toSlug(next.slug);
  }

  if (next.tags) next.tags = normalizeTags(next.tags);
  if (next.metaKeywords) next.metaKeywords = normalizeTags(next.metaKeywords);

  if (next.published === true && !next.publishedAt) {
    next.publishedAt = new Date();
  }

  if (next.published === false) {
    next.publishedAt = null;
  }

  return next;
}

async function ensureUniqueSlug(slug: string, excludeId?: string) {
  const baseSlug = slug || "blog";
  let candidate = baseSlug;
  let suffix = 1;

  while (
    await Blog.exists({
      slug: candidate,
      ...(excludeId ? { _id: { $ne: excludeId } } : {}),
    })
  ) {
    candidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

export const BlogService = {
  async createBlog(payload: Record<string, any>) {
    const next = withPublishDate(payload);
    next.slug = await ensureUniqueSlug(next.slug || toSlug(next.title));

    return Blog.create(next);
  },

  async getBlogs(options: BlogQueryOptions = {}) {
    const page = Math.max(Number(options.page) || 1, 1);
    const limit = Math.min(Math.max(Number(options.limit) || 10, 1), 100);
    const skip = (page - 1) * limit;

    const filter: FilterQuery<any> = {};

    if (options.q) {
      const query = new RegExp(escapeRegExp(options.q), "i");
      filter.$or = [
        { title: query },
        { excerpt: query },
        { content: query },
        { category: query },
        { tags: query },
      ];
    }

    if (options.category) {
      filter.category = new RegExp(`^${escapeRegExp(options.category)}$`, "i");
    }

    if (options.tag) {
      filter.tags = new RegExp(`^${escapeRegExp(options.tag)}$`, "i");
    }

    if (typeof options.published === "boolean") {
      filter.published = options.published;
    }

    if (typeof options.featured === "boolean") {
      filter.featured = options.featured;
    }

    const sortField = options.sortBy && allowedSortFields.has(options.sortBy)
      ? options.sortBy
      : "createdAt";
    const sortDirection: SortOrder = options.sortOrder === "asc" ? 1 : -1;

    const [items, total] = await Promise.all([
      Blog.find(filter)
        .sort({ [sortField]: sortDirection })
        .skip(skip)
        .limit(limit)
        .lean(),
      Blog.countDocuments(filter),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  async getBlogById(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return Blog.findById(id);
  },

  async getBlogBySlug(slug: string) {
    return Blog.findOne({ slug: toSlug(slug) });
  },

  async updateBlog(id: string, payload: Record<string, any>) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;

    const next = withPublishDate(payload);
    if (next.slug) {
      next.slug = await ensureUniqueSlug(next.slug, id);
    } else if (next.title) {
      next.slug = await ensureUniqueSlug(toSlug(next.title), id);
    }

    return Blog.findByIdAndUpdate(id, next, {
      new: true,
      runValidators: true,
    });
  },

  async deleteBlog(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return Blog.findByIdAndDelete(id);
  },

  async incrementViews(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return Blog.findByIdAndUpdate(id, { $inc: { views: 1 } });
  },
};
