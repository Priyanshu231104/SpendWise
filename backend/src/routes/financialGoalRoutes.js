
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

router.post("/", authenticate, createFinancialGoal);
router.get("/", authenticate, getFinancialGoals);
router.get("/:id", authenticate, getFinancialGoalById);
router.patch("/:id", authenticate, updateFinancialGoal);
router.delete("/:id", authenticate, deleteFinancialGoal);

export default router;
