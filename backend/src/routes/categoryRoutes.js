
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

/**
 * Category routes.
 * All endpoints require authentication.
 */

// Create a category.
router.post("/", authenticate, createCategory);

// Get all categories belonging to the authenticated user.
router.get("/", authenticate, getCategories);

// Get a specific category.
router.get("/:id", authenticate, getCategoryById);

// Update a category.
router.patch("/:id", authenticate, updateCategory);

// Archive a category.
router.patch("/:id/archive", authenticate, archiveCategory);

export default router;
