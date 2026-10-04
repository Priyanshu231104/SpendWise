import express from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import {
  getCurrentUser,
  updateCurrentUser,
  changePassword,
} from "../controllers/userController.js";

const router = express.Router();

router.get("/me", authenticate, getCurrentUser);
router.put("/me", authenticate, updateCurrentUser);
router.put("/me/password", authenticate, changePassword);

export default router;