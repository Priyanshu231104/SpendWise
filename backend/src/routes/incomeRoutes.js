
import express from "express";

import { authenticate } from "../middleware/authMiddleware.js";

import {
  createIncome,
  getIncome,
  getIncomeById,
  updateIncome,
  deleteIncome,
} from "../controllers/incomeController.js";

const router = express.Router();

/**
 * Income routes.
 * All endpoints require authentication.
 */

// Create an income record.
router.post("/", authenticate, createIncome);

// Get all income records belonging to the authenticated user.
router.get("/", authenticate, getIncome);

// Get a specific income record.
router.get("/:id", authenticate, getIncomeById);

// Update an income record.
router.patch("/:id", authenticate, updateIncome);

// Delete an income record.
router.delete("/:id", authenticate, deleteIncome);

export default router;
