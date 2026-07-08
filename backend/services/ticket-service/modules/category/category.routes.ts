import express from "express";
import {
  createCategory,
  deleteCategory,
  getCategory,
  listCategories,
  updateCategory,
} from "./category.controller";
import { validateCategory } from "./category.validation";

const router = express.Router();

router.get("/", listCategories);
router.post("/", validateCategory(), createCategory);
router.get("/:id", getCategory);
router.patch("/:id", validateCategory(true), updateCategory);
router.delete("/:id", deleteCategory);

export default router;

