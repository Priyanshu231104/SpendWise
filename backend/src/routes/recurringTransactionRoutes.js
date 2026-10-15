
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

router.post("/", authenticate, createRecurringTransaction);
router.get("/", authenticate, getRecurringTransactions);
router.get("/:id", authenticate, getRecurringTransactionById);
router.patch("/:id", authenticate, updateRecurringTransaction);
router.patch("/:id/status", authenticate, setRecurringTransactionStatus);
router.delete("/:id", authenticate, deleteRecurringTransaction);

export default router;
