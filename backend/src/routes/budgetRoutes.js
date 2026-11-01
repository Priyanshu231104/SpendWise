
import express from "express";

import { authenticate } from "../middleware/authMiddleware.js";

import {
  createBudget,
  getBudgets,
  getBudgetById,
  updateBudget,
  deleteBudget,
} from "../controllers/budgetController.js";

const router = express.Router();

/**
 * Budget routes.
 * All endpoints require authentication.
 */

// Create a budget.
router.post("/", authenticate, createBudget);

// Get all budgets belonging to the authenticated user.
router.get("/", authenticate, getBudgets);

// Get a specific budget.
router.get("/:id", authenticate, getBudgetById);

// Update a budget.
router.patch("/:id", authenticate, updateBudget);

// Delete a budget.
router.delete("/:id", authenticate, deleteBudget);

export default router;
