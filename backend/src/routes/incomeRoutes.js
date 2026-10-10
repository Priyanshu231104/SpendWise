import express from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import {
  createIncome,
  getIncome,
  getIncomeById,
  updateIncome,
  deleteIncome,
} from "../controllers/incomeController.js";

const router = express.Router();

router.post("/", authenticate, createIncome);
router.get("/", authenticate, getIncome);
router.get("/:id", authenticate, getIncomeById);
router.patch("/:id", authenticate, updateIncome);
router.delete("/:id", authenticate, deleteIncome);

export default router;