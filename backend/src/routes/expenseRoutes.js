
import express from "express";

import { authenticate } from "../middleware/authMiddleware.js";

import {
  createExpense,
  getExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
} from "../controllers/expenseController.js";

const router = express.Router();

/**
 * Expense routes.
 * All endpoints require authentication.
 */

// Create an expense.
router.post("/", authenticate, createExpense);

// Get all expenses belonging to the authenticated user.
router.get("/", authenticate, getExpenses);

// Get a specific expense.
router.get("/:id", authenticate, getExpenseById);

// Update an expense.
router.patch("/:id", authenticate, updateExpense);

// Delete an expense.
router.delete("/:id", authenticate, deleteExpense);

export default router;
