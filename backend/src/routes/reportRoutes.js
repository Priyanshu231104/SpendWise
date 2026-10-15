
import express from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import {
  getFinancialReportSummary,
  getCategoryBreakdownReport,
  getBudgetPerformanceReport,
} from "../controllers/reportController.js";

const router = express.Router();

// Financial summary report
router.get(
  "/summary",
  authenticate,
  getFinancialReportSummary
);

// Expense category breakdown report
router.get(
  "/category-breakdown",
  authenticate,
  getCategoryBreakdownReport
);

router.get(
  "/budget-performance",
  authenticate,
  getBudgetPerformanceReport
);

export default router;
