
import express from "express";
import rateLimit from "express-rate-limit";

import {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
} from "../controllers/authController.js";

const router = express.Router();

const AUTH_WINDOW_MS = 15 * 60 * 1000;

/**
 * Validates the request Origin against FRONTEND_URL.
 *
 * This is an additional browser-origin security check,
 * not a replacement for authentication or CSRF protection.
 */
const requireTrustedOrigin = (req, res, next) => {
  const frontendUrl = process.env.FRONTEND_URL;
  const requestOrigin = req.get("Origin");

  if (!frontendUrl || !requestOrigin) {
    return res.status(403).json({
      success: false,
      message: "Request origin is not allowed",
    });
  }

  try {
    const trustedUrl = new URL(frontendUrl);
    const receivedUrl = new URL(requestOrigin);

    const validTrustedUrl =
      ["http:", "https:"].includes(trustedUrl.protocol) &&
      trustedUrl.origin !== "null" &&
      trustedUrl.username === "" &&
      trustedUrl.password === "" &&
      trustedUrl.pathname === "/" &&
      !trustedUrl.search &&
      !trustedUrl.hash;

    const validReceivedUrl =
      ["http:", "https:"].includes(receivedUrl.protocol) &&
      receivedUrl.origin !== "null" &&
      receivedUrl.username === "" &&
      receivedUrl.password === "" &&
      receivedUrl.pathname === "/" &&
      !receivedUrl.search &&
      !receivedUrl.hash;

    if (!validTrustedUrl || !validReceivedUrl) {
      return res.status(403).json({
        success: false,
        message: "Invalid request origin",
      });
    }

    if (receivedUrl.origin !== trustedUrl.origin) {
      return res.status(403).json({
        success: false,
        message: "Request origin is not allowed",
      });
    }

    return next();
  } catch {
    return res.status(403).json({
      success: false,
      message: "Invalid request origin",
    });
  }
};

/**
 * Authentication rate limiter.
 *
 * Applies to registration and login.
 */
const authLimiter = rateLimit({
  windowMs: AUTH_WINDOW_MS,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many authentication attempts. Please try again later.",
  },
});

/**
 * Refresh token rate limiter.
 */
const refreshLimiter = rateLimit({
  windowMs: AUTH_WINDOW_MS,
  limit: 30,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many refresh attempts. Please try again later.",
  },
});

/**
 * Apply trusted-origin validation to all authentication routes.
 */
router.use(requireTrustedOrigin);

/**
 * Authentication endpoints.
 */
router.post("/register", authLimiter, registerUser);

router.post("/login", authLimiter, loginUser);

router.post("/refresh", refreshLimiter, refreshAccessToken);

router.post("/logout", logoutUser);

export default router;
