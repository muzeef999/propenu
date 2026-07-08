import type { FilterQuery } from "mongoose";
import { Department } from "./department.model";
import type { DepartmentDocument } from "./department.interface";

export class DepartmentService {
  static create(payload: Partial<DepartmentDocument>) {
    return Department.create(payload);
  }

  static async list(query: Record<string, unknown>) {
    const page = Math.max(Number(query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(query.limit) || 50, 1), 100);
    const filter: FilterQuery<DepartmentDocument> = {};

    if (typeof query.q === "string") filter.$text = { $search: query.q };
    if (query.active === "true") filter.isActive = true;
    if (query.active === "false") filter.isActive = false;
    if (typeof query.memberId === "string") filter["members.userId"] = query.memberId;

    const [data, total] = await Promise.all([
      Department.find(filter).sort({ name: 1 }).skip((page - 1) * limit).limit(limit).lean(),
      Department.countDocuments(filter),
    ]);

    return { data, meta: { total, page, limit, pages: Math.ceil(total / limit) } };
  }

  static get(id: string) {
    return Department.findById(id);
  }

  static update(id: string, payload: Partial<DepartmentDocument>) {
    return Department.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
  }

  static remove(id: string) {
    return Department.findByIdAndUpdate(id, { isActive: false }, { new: true });
  }

  static addMember(id: string, member: unknown) {
    return Department.findByIdAndUpdate(id, { $addToSet: { members: member } }, { new: true, runValidators: true });
  }

  static removeMember(id: string, userId: string) {
    return Department.findByIdAndUpdate(id, { $pull: { members: { userId } } }, { new: true });
  }
}

