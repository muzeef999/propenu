import type { FilterQuery } from "mongoose";
import { Category } from "./category.model";
import type { CategoryDocument } from "./category.interface";

const normalizeTags = (tags?: string[]) =>
  Array.from(new Set((tags ?? []).map((tag) => tag.trim().toLowerCase()).filter(Boolean)));

export class CategoryService {
  static create(payload: Partial<CategoryDocument>) {
    return Category.create({ ...payload, tags: normalizeTags(payload.tags) });
  }

  static async list(query: Record<string, unknown>) {
    const page = Math.max(Number(query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(query.limit) || 50, 1), 100);
    const filter: FilterQuery<CategoryDocument> = {};

    if (typeof query.q === "string") filter.$text = { $search: query.q };
    if (typeof query.department === "string") filter.department = query.department;
    if (query.active === "true") filter.isActive = true;
    if (query.active === "false") filter.isActive = false;

    const [data, total] = await Promise.all([
      Category.find(filter).sort({ priorityWeight: -1, name: 1 }).skip((page - 1) * limit).limit(limit).lean(),
      Category.countDocuments(filter),
    ]);

    return { data, meta: { total, page, limit, pages: Math.ceil(total / limit) } };
  }

  static get(id: string) {
    return Category.findById(id);
  }

  static update(id: string, payload: Partial<CategoryDocument>) {
    const update = { ...payload };
    if (payload.tags) update.tags = normalizeTags(payload.tags);
    return Category.findByIdAndUpdate(id, update, { new: true, runValidators: true });
  }

  static remove(id: string) {
    return Category.findByIdAndUpdate(id, { isActive: false }, { new: true });
  }
}

