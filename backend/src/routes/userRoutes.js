
import express from "express";

import { authenticate } from "../middleware/authMiddleware.js";

import {
  getCurrentUser,
  updateCurrentUser,
  changePassword,
} from "../controllers/userController.js";

const router = express.Router();

/**
 * Current user profile routes.
 * All endpoints require authentication.
 */

// Get authenticated user's profile.
router.get("/me", authenticate, getCurrentUser);

// Update authenticated user's profile.
router.put("/me", authenticate, updateCurrentUser);

// Change authenticated user's password.
router.put("/me/password", authenticate, changePassword);

export default router;
