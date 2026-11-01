
import express from "express";

import { authenticate } from "../middleware/authMiddleware.js";

import {
  createRecurringTransaction,
  getRecurringTransactions,
  getRecurringTransactionById,
  updateRecurringTransaction,
  setRecurringTransactionStatus,
  deleteRecurringTransaction,
} from "../controllers/recurringTransactionController.js";

const router = express.Router();

/**
 * Recurring transaction routes.
 * All endpoints require authentication.
 */

// Create a recurring transaction schedule.
router.post("/", authenticate, createRecurringTransaction);

// Get all recurring transaction schedules.
router.get("/", authenticate, getRecurringTransactions);

// Get a specific recurring transaction schedule.
router.get("/:id", authenticate, getRecurringTransactionById);

// Update a recurring transaction schedule.
router.patch("/:id", authenticate, updateRecurringTransaction);

// Pause or resume a recurring transaction schedule.
router.patch("/:id/status", authenticate, setRecurringTransactionStatus);

// Delete a recurring transaction schedule.
router.delete("/:id", authenticate, deleteRecurringTransaction);

export default router;
