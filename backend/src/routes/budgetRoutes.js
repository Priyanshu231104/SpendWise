
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

router.post("/", authenticate, createBudget);
router.get("/", authenticate, getBudgets);
router.get("/:id", authenticate, getBudgetById);
router.patch("/:id", authenticate, updateBudget);
router.delete("/:id", authenticate, deleteBudget);

export default router;
