import type { Request, Response } from "express";
import { DepartmentService } from "./department.service";

const notFound = (res: Response) => res.status(404).json({ success: false, message: "Department not found" });

export const createDepartment = async (req: Request, res: Response) => {
  try {
    const data = await DepartmentService.create(req.body);
    return res.status(201).json({ success: true, data });
  } catch (err: any) {
    if (err?.code === 11000) return res.status(409).json({ success: false, message: "Department slug already exists" });
    return res.status(500).json({ success: false, message: err.message || "Internal server error" });
  }
};

export const listDepartments = async (req: Request, res: Response) => {
  try {
    return res.json({ success: true, ...(await DepartmentService.list(req.query)) });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message || "Internal server error" });
  }
};

export const getDepartment = async (req: Request, res: Response) => {
  try {
    if (!req.params.id) return res.status(400).json({ success: false, message: "Missing department id" });
    const data = await DepartmentService.get(req.params.id);
    if (!data) return notFound(res);
    return res.json({ success: true, data });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message || "Internal server error" });
  }
};

export const updateDepartment = async (req: Request, res: Response) => {
  try {
    if (!req.params.id) return res.status(400).json({ success: false, message: "Missing department id" });
    const data = await DepartmentService.update(req.params.id, req.body);
    if (!data) return notFound(res);
    return res.json({ success: true, data });
  } catch (err: any) {
    if (err?.code === 11000) return res.status(409).json({ success: false, message: "Department slug already exists" });
    return res.status(500).json({ success: false, message: err.message || "Internal server error" });
  }
};

export const deleteDepartment = async (req: Request, res: Response) => {
  try {
    if (!req.params.id) return res.status(400).json({ success: false, message: "Missing department id" });
    const data = await DepartmentService.remove(req.params.id);
    if (!data) return notFound(res);
    return res.json({ success: true, data });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message || "Internal server error" });
  }
};

export const addDepartmentMember = async (req: Request, res: Response) => {
  try {
    if (!req.params.id) return res.status(400).json({ success: false, message: "Missing department id" });
    if (!req.body?.userId) return res.status(400).json({ success: false, message: "member.userId is required" });
    const data = await DepartmentService.addMember(req.params.id, req.body);
    if (!data) return notFound(res);
    return res.json({ success: true, data });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message || "Internal server error" });
  }
};

export const removeDepartmentMember = async (req: Request, res: Response) => {
  try {
    if (!req.params.id || !req.params.userId) return res.status(400).json({ success: false, message: "Missing department id or user id" });
    const data = await DepartmentService.removeMember(req.params.id, req.params.userId);
    if (!data) return notFound(res);
    return res.json({ success: true, data });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message || "Internal server error" });
  }
};

