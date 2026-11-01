
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const ALLOWED_ROLES = ["USER", "ADMIN"];

export const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // Validate Authorization header format
    if (
      typeof authHeader !== "string" ||
      !authHeader.startsWith("Bearer ")
    ) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const accessToken = authHeader.slice(7).trim();

    if (!accessToken || accessToken.includes(" ")) {
      return res.status(401).json({
        success: false,
        message: "Invalid access token format",
      });
    }

    const secret = process.env.ACCESS_TOKEN_SECRET;

    if (!secret) {
      console.error("ACCESS_TOKEN_SECRET is not configured");

      return res.status(500).json({
        success: false,
        message: "Authentication service unavailable",
      });
    }

    // Verify JWT signature and algorithm
    const decoded = jwt.verify(accessToken, secret, {
      algorithms: ["HS256"],
    });

    // Validate required JWT claims
    if (
      typeof decoded !== "object" ||
      typeof decoded.sub !== "string" ||
      !mongoose.isValidObjectId(decoded.sub) ||
      !ALLOWED_ROLES.includes(decoded.role)
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid access token payload",
      });
    }

    req.user = {
      id: decoded.sub,
      role: decoded.role,
    };

    return next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired access token",
      });
    }

    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired access token",
      });
    }

    console.error("Authentication middleware error:", error);

    return res.status(500).json({
      success: false,
      message: "Authentication service error",
    });
  }
};
