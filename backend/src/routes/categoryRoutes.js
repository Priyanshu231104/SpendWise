
import express from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  archiveCategory,
} from "../controllers/categoryController.js";

const router = express.Router();

router.post("/", authenticate, createCategory);
router.get("/", authenticate, getCategories);
router.get("/:id", authenticate, getCategoryById);
router.patch("/:id", authenticate, updateCategory);
router.patch("/:id/archive", authenticate, archiveCategory);

export default router;
