
import express from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import {
  getBudgetAlerts,
  getSpendingComparison,
  getSavingsRateInsights,
  getFinancialHealthSummary,
} from "../controllers/insightsController.js";

const router = express.Router();

// Budget alerts
router.get("/budget-alerts", authenticate, getBudgetAlerts);

// Spending comparison
router.get("/spending-comparison", authenticate, getSpendingComparison);

// Savings rate insights
router.get("/savings-rate", authenticate, getSavingsRateInsights);

// Financial health summary
router.get("/financial-health", authenticate, getFinancialHealthSummary);

export default router;
