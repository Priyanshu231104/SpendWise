
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

router.post("/", authenticate, createExpense);
router.get("/", authenticate, getExpenses);
router.get("/:id", authenticate, getExpenseById);
router.patch("/:id", authenticate, updateExpense);
router.delete("/:id", authenticate, deleteExpense);

export default router;
