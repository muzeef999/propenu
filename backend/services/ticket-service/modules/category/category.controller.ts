import type { Request, Response } from "express";
import { CategoryService } from "./category.service";

const notFound = (res: Response) => res.status(404).json({ success: false, message: "Category not found" });

export const createCategory = async (req: Request, res: Response) => {
  try {
    const data = await CategoryService.create(req.body);
    return res.status(201).json({ success: true, data });
  } catch (err: any) {
    if (err?.code === 11000) return res.status(409).json({ success: false, message: "Category slug already exists" });
    return res.status(500).json({ success: false, message: err.message || "Internal server error" });
  }
};

export const listCategories = async (req: Request, res: Response) => {
  try {
    return res.json({ success: true, ...(await CategoryService.list(req.query)) });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message || "Internal server error" });
  }
};

export const getCategory = async (req: Request, res: Response) => {
  try {
    if (!req.params.id) return res.status(400).json({ success: false, message: "Missing category id" });
    const data = await CategoryService.get(req.params.id);
    if (!data) return notFound(res);
    return res.json({ success: true, data });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message || "Internal server error" });
  }
};

export const updateCategory = async (req: Request, res: Response) => {
  try {
    if (!req.params.id) return res.status(400).json({ success: false, message: "Missing category id" });
    const data = await CategoryService.update(req.params.id, req.body);
    if (!data) return notFound(res);
    return res.json({ success: true, data });
  } catch (err: any) {
    if (err?.code === 11000) return res.status(409).json({ success: false, message: "Category slug already exists" });
    return res.status(500).json({ success: false, message: err.message || "Internal server error" });
  }
};

export const deleteCategory = async (req: Request, res: Response) => {
  try {
    if (!req.params.id) return res.status(400).json({ success: false, message: "Missing category id" });
    const data = await CategoryService.remove(req.params.id);
    if (!data) return notFound(res);
    return res.json({ success: true, data });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message || "Internal server error" });
  }
};

