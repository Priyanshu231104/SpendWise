
import express from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import {
  getDashboardSummary,
} from "../controllers/dashboardController.js";

const router = express.Router();

router.get("/summary", authenticate, getDashboardSummary);

export default router;
