
import express from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import {
  getMonthlyTrends,
  getSpendingDistribution,
  getSavingsTrend,
} from "../controllers/analyticsController.js";

const router = express.Router();

router.get(
  "/monthly-trends",
  authenticate,
  getMonthlyTrends
);

router.get(
  "/spending-distribution",
  authenticate,
  getSpendingDistribution
);

router.get(
  "/savings-trend",
  authenticate,
  getSavingsTrend
);

export default router;
