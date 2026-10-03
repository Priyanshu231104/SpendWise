import express from "express";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/me", authenticate, (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Authentication successful",
    data: {
      userId: req.user.id,
      role: req.user.role,
    },
  });
});

export default router;