import express from "express";
import {
  addDepartmentMember,
  createDepartment,
  deleteDepartment,
  getDepartment,
  listDepartments,
  removeDepartmentMember,
  updateDepartment,
} from "./department.controller";
import { validateDepartment } from "./department.validation";

const router = express.Router();

router.get("/", listDepartments);
router.post("/", validateDepartment(), createDepartment);
router.get("/:id", getDepartment);
router.patch("/:id", validateDepartment(true), updateDepartment);
router.delete("/:id", deleteDepartment);
router.post("/:id/members", addDepartmentMember);
router.delete("/:id/members/:userId", removeDepartmentMember);

export default router;

