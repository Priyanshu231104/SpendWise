
import mongoose from "mongoose";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";

import connectDB from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import expenseRoutes from "./routes/expenseRoutes.js";
import incomeRoutes from "./routes/incomeRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import budgetRoutes from "./routes/budgetRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import financialGoalRoutes from "./routes/financialGoalRoutes.js";
import recurringTransactionRoutes from "./routes/recurringTransactionRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import insightsRoutes from "./routes/insightsRoutes.js";

dotenv.config();

// Validate required environment variables.
const validateEnvironment = () => {
  const requiredVariables = [
    "FRONTEND_URL",
    "MONGODB_URI",
    "ACCESS_TOKEN_SECRET",
    "REFRESH_TOKEN_SECRET",
  ];

  const missingVariables = requiredVariables.filter(
    (name) => !process.env[name]?.trim()
  );

  if (missingVariables.length > 0) {
    throw new Error(
      `Missing environment variables: ${missingVariables.join(", ")}`
    );
  }

  const accessSecret = process.env.ACCESS_TOKEN_SECRET;
  const refreshSecret = process.env.REFRESH_TOKEN_SECRET;

  if (
    accessSecret.length < 32 ||
    refreshSecret.length < 32 ||
    accessSecret !== accessSecret.trim() ||
    refreshSecret !== refreshSecret.trim() ||
    accessSecret === refreshSecret
  ) {
    throw new Error(
      "JWT secrets must be strong, different, and properly formatted"
    );
  }

  try {
    const frontendUrl = new URL(process.env.FRONTEND_URL);

    if (
      !["http:", "https:"].includes(frontendUrl.protocol) ||
      frontendUrl.origin !== process.env.FRONTEND_URL
    ) {
      throw new Error();
    }
  } catch {
    throw new Error(
      "FRONTEND_URL must be a valid frontend origin without a path or trailing slash"
    );
  }
};

validateEnvironment();

// Validate the server port.
const PORT = Number(process.env.PORT || 5000);

if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65535) {
  throw new Error("PORT must be a valid number between 1 and 65535");
}

const app = express();

// Security headers.
app.use(helmet());

// CORS configuration.
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);

// Parse JSON request bodies.
app.use(express.json({ limit: "100kb" }));

// Parse cookies without an additional dependency.
app.use((req, res, next) => {
  req.cookies = {};

  const cookieHeader = req.headers.cookie;

  if (cookieHeader) {
    try {
      cookieHeader.split(";").forEach((cookie) => {
        const separatorIndex = cookie.indexOf("=");

        if (separatorIndex === -1) return;

        const name = cookie.slice(0, separatorIndex).trim();
        const value = cookie.slice(separatorIndex + 1).trim();

        if (!name) return;

        try {
          req.cookies[name] = decodeURIComponent(value);
        } catch {
          // Ignore cookies with malformed encoding.
        }
      });
    } catch (error) {
      return next(error);
    }
  }

  next();
});

// General API rate limiting.
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: "draft-8",
  legacyHeaders: false,
});

app.use("/api", apiLimiter);

// API routes.
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/expenses", expenseRoutes);
app.use("/api/v1/income", incomeRoutes);
app.use("/api/v1/categories", categoryRoutes);
app.use("/api/v1/budgets", budgetRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);
app.use("/api/v1/goals", financialGoalRoutes);
app.use("/api/v1/recurring-transactions", recurringTransactionRoutes);
app.use("/api/v1/reports", reportRoutes);
app.use("/api/v1/analytics", analyticsRoutes);
app.use("/api/v1/insights", insightsRoutes);

// Basic health check.
app.get("/api/v1/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "SpendWise API is running",
    timestamp: new Date().toISOString(),
  });
});

// Database readiness check.
app.get("/api/v1/ready", (req, res) => {
  const isDatabaseConnected = mongoose.connection.readyState === 1;

  if (!isDatabaseConnected) {
    return res.status(503).json({
      success: false,
      message: "Database is not ready",
    });
  }

  return res.status(200).json({
    success: true,
    message: "SpendWise API is ready",
  });
});

// Handle unknown routes.
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Centralized error handler.
app.use((error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  const requestedStatus = Number(error.status || error.statusCode);

  const statusCode =
    Number.isInteger(requestedStatus) &&
    requestedStatus >= 400 &&
    requestedStatus <= 599
      ? requestedStatus
      : 500;

  if (statusCode >= 500) {
    console.error("Server error:", error);
  }

  let message = "Internal server error";

  if (error.type === "entity.parse.failed") {
    message = "Invalid JSON request body";
  } else if (error.type === "entity.too.large") {
    message = "Request body is too large";
  } else if (statusCode < 500) {
    message = error.message || "Request failed";
  }

  return res.status(statusCode).json({
    success: false,
    message,
  });
});

// Start the server only after MongoDB connects.
let server;
let isShuttingDown = false;

const startServer = async () => {
  try {
    await connectDB();

    server = app.listen(PORT, () => {
      console.log(`SpendWise API listening on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
};

// Graceful shutdown.
const shutdown = (signal) => {
  if (isShuttingDown) return;

  isShuttingDown = true;

  console.log(`${signal} received. Shutting down SpendWise...`);

  const forceShutdownTimer = setTimeout(() => {
    console.error("Graceful shutdown timed out.");
    process.exit(1);
  }, 10000);

  forceShutdownTimer.unref();

  if (!server) {
    mongoose
      .disconnect()
      .then(() => process.exit(0))
      .catch((error) => {
        console.error("Shutdown error:", error.message);
        process.exit(1);
      });

    return;
  }

  server.close(async (error) => {
    try {
      await mongoose.disconnect();

      if (error) {
        throw error;
      }

      console.log("MongoDB disconnected. Shutdown complete.");
      clearTimeout(forceShutdownTimer);
      process.exit(0);
    } catch (shutdownError) {
      console.error("Shutdown error:", shutdownError.message);
      process.exit(1);
    }
  });
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

startServer();
