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
const app = express();

const PORT = process.env.PORT || 5000;


 // Security middleware
app.use(helmet());

// Allow the local frontend to send requests with cookies.
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

// Parse JSON request bodies.
app.use(express.json());

// Parse cookies without adding another dependency.
app.use((req, res, next) => {
  req.cookies = {};

  const cookieHeader = req.headers.cookie;

  if (cookieHeader) {
    cookieHeader.split(";").forEach((cookie) => {
      const separatorIndex = cookie.indexOf("=");

      if (separatorIndex === -1) return;

      const name = cookie.slice(0, separatorIndex).trim();
      const value = cookie.slice(separatorIndex + 1).trim();

      if (name) {
        req.cookies[name] = decodeURIComponent(value);
      }
    });
  }

  next();
});


// Basic rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: "draft-8",
  legacyHeaders: false,
});

app.use("/api", apiLimiter);

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/expenses", expenseRoutes);
app.use("/api/v1/income", incomeRoutes);
app.use("/api/v1/categories", categoryRoutes);
app.use("/api/v1/budgets", budgetRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);
app.use("/api/v1/goals", financialGoalRoutes);
app.use(
  "/api/v1/recurring-transactions",
  recurringTransactionRoutes
);
app.use("/api/v1/reports", reportRoutes);
app.use("/api/v1/analytics", analyticsRoutes);
app.use("/api/v1/insights", insightsRoutes);

// Health check
app.get("/api/v1/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "SpendWise API is running",
    timestamp: new Date().toISOString(),
  });
});

 // Start server only after MongoDB connects
const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(
        `SpendWise API running on http://localhost:${PORT}`
      );
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
};

startServer();