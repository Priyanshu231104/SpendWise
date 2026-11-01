
import express from "express";

import { authenticate } from "../middleware/authMiddleware.js";

import {
  createFinancialGoal,
  getFinancialGoals,
  getFinancialGoalById,
  updateFinancialGoal,
  deleteFinancialGoal,
} from "../controllers/financialGoalController.js";

const router = express.Router();

/**
 * Financial goal routes.
 * All endpoints require authentication.
 */

// Create a financial goal.
router.post("/", authenticate, createFinancialGoal);

// Get all financial goals belonging to the authenticated user.
router.get("/", authenticate, getFinancialGoals);

// Get a specific financial goal.
router.get("/:id", authenticate, getFinancialGoalById);

// Update a financial goal.
router.patch("/:id", authenticate, updateFinancialGoal);

// Delete a financial goal.
router.delete("/:id", authenticate, deleteFinancialGoal);

export default router;
