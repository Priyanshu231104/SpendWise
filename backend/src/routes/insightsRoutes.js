
import express from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import {
  getBudgetAlerts,
  getSpendingComparison,
  getSavingsRateInsights,
  getFinancialHealthSummary,
} from "../controllers/insightsController.js";

const router = express.Router();

router.get("/budget-alerts", authenticate, getBudgetAlerts);

router.get(
  "/spending-comparison",
  authenticate,
  getSpendingComparison
);

router.get(
  "/savings-rate",
  authenticate,
  getSavingsRateInsights
);

router.get(
  "/financial-health",
  authenticate,
  getFinancialHealthSummary
);

export default router;
