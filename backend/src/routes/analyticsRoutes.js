
import express from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import {
  getMonthlyTrends,
  getSpendingDistribution,
  getSavingsTrend,
} from "../controllers/analyticsController.js";

const router = express.Router();

// Monthly transaction trends
router.get("/monthly-trends", authenticate, getMonthlyTrends);

// Spending distribution by category
router.get("/spending-distribution", authenticate, getSpendingDistribution);

// Savings trend
router.get("/savings-trend", authenticate, getSavingsTrend);

export default router;
