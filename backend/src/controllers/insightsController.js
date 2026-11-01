
import mongoose from "mongoose";
import Budget from "../models/Budget.js";
import Transaction from "../models/Transaction.js";

/**
 * Converts the authenticated user's ID into a MongoDB ObjectId.
 * Returns null if the ID is missing or invalid.
 */
const getAuthenticatedUserId = (req) => {
  const userId = req.user?.id;

  if (!userId || !mongoose.isValidObjectId(userId)) {
    return null;
  }

  return new mongoose.Types.ObjectId(userId);
};

/**
 * Returns a percentage rounded to two decimal places.
 * Returns null when the denominator is zero or the result is invalid.
 */
const calculatePercentage = (numerator, denominator) => {
  if (
    !Number.isFinite(numerator) ||
    !Number.isFinite(denominator) ||
    denominator <= 0
  ) {
    return null;
  }

  const percentage = (numerator / denominator) * 100;

  return Number.isFinite(percentage)
    ? Number(percentage.toFixed(2))
    : null;
};

/**
 * Gets the UTC start of the current month and the next month.
 */
const getCurrentMonthRange = () => {
  const now = new Date();

  const monthStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)
  );

  const nextMonthStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)
  );

  return {
    now,
    monthStart,
    nextMonthStart,
  };
};

/**
 * Returns an authentication error when the user ID is invalid.
 */
const sendUnauthorized = (res) => {
  return res.status(401).json({
    success: false,
    message: "Unauthorized. Please log in again.",
  });
};

/**
 * GET BUDGET ALERTS
 *
 * Returns current budget usage and alert status.
 */
export const getBudgetAlerts = async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req);

    if (!userId) {
      return sendUnauthorized(res);
    }

    const now = new Date();

    const budgets = await Budget.find({
      userId,
      periodStart: { $lte: now },
      periodEnd: { $gt: now },
    }).lean();

    const alerts = await Promise.all(
      budgets.map(async (budget) => {
        const match = {
          userId,
          type: "EXPENSE",
          currency: budget.currency,
          date: {
            $gte: budget.periodStart,
            $lt: budget.periodEnd,
          },
        };

        if (budget.categoryId) {
          match.categoryId = budget.categoryId;
        }

        const [result] = await Transaction.aggregate([
          {
            $match: match,
          },
          {
            $group: {
              _id: null,
              spentMinor: { $sum: "$amountMinor" },
              transactionCount: { $sum: 1 },
            },
          },
        ]);

        const spentMinor = result?.spentMinor ?? 0;
        const transactionCount = result?.transactionCount ?? 0;

        const remainingMinor = budget.amountMinor - spentMinor;

        const percentageUsed = calculatePercentage(
          spentMinor,
          budget.amountMinor
        );

        let status = "ON_TRACK";

        if (percentageUsed !== null) {
          if (percentageUsed >= 100) {
            status = "EXCEEDED";
          } else if (percentageUsed >= 80) {
            status = "WARNING";
          }
        }

        return {
          budgetId: budget._id,
          name: budget.name,
          currency: budget.currency,
          budgetAmountMinor: budget.amountMinor,
          spentMinor,
          remainingMinor,
          percentageUsed: percentageUsed ?? 0,
          transactionCount,
          status,
        };
      })
    );

    return res.status(200).json({
      success: true,
      asOf: now.toISOString(),
      count: alerts.length,
      data: alerts,
    });
  } catch (error) {
    console.error("Get budget alerts error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve budget alerts.",
    });
  }
};

/**
 * GET SPENDING COMPARISON
 *
 * Compares expenses in the current month with the previous month.
 * Results are grouped by currency.
 */
export const getSpendingComparison = async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req);

    if (!userId) {
      return sendUnauthorized(res);
    }

    const now = new Date();

    const currentStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)
    );

    const nextMonthStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)
    );

    const previousStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1)
    );

    const results = await Transaction.aggregate([
      {
        $match: {
          userId,
          type: "EXPENSE",
          date: {
            $gte: previousStart,
            $lt: nextMonthStart,
          },
        },
      },
      {
        $group: {
          _id: {
            currency: "$currency",
            period: {
              $cond: [
                { $gte: ["$date", currentStart] },
                "CURRENT",
                "PREVIOUS",
              ],
            },
          },
          totalMinor: { $sum: "$amountMinor" },
          transactionCount: { $sum: 1 },
        },
      },
    ]);

    const currencyMap = new Map();

    for (const item of results) {
      const currency = item._id.currency;

      if (!currencyMap.has(currency)) {
        currencyMap.set(currency, {
          currency,
          previousMonthExpensesMinor: 0,
          currentMonthExpensesMinor: 0,
          previousMonthTransactionCount: 0,
          currentMonthTransactionCount: 0,
        });
      }

      const entry = currencyMap.get(currency);

      if (item._id.period === "CURRENT") {
        entry.currentMonthExpensesMinor = item.totalMinor;
        entry.currentMonthTransactionCount = item.transactionCount;
      } else {
        entry.previousMonthExpensesMinor = item.totalMinor;
        entry.previousMonthTransactionCount = item.transactionCount;
      }
    }

    const data = Array.from(currencyMap.values()).map((entry) => {
      const differenceMinor =
        entry.currentMonthExpensesMinor -
        entry.previousMonthExpensesMinor;

      const percentageChange = calculatePercentage(
        differenceMinor,
        entry.previousMonthExpensesMinor
      );

      let trend = "UNCHANGED";

      if (differenceMinor > 0) {
        trend = "INCREASED";
      } else if (differenceMinor < 0) {
        trend = "DECREASED";
      }

      return {
        ...entry,
        differenceMinor,
        percentageChange,
        trend,
      };
    });

    return res.status(200).json({
      success: true,
      periods: {
        previousMonth: {
          from: previousStart.toISOString(),
          to: currentStart.toISOString(),
        },
        currentMonth: {
          from: currentStart.toISOString(),
          to: nextMonthStart.toISOString(),
        },
      },
      data,
    });
  } catch (error) {
    console.error("Get spending comparison error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve spending comparison.",
    });
  }
};

/**
 * GET SAVINGS RATE INSIGHTS
 *
 * Calculates income, expenses, net savings, and savings rate
 * for the current month, grouped by currency.
 */
export const getSavingsRateInsights = async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req);

    if (!userId) {
      return sendUnauthorized(res);
    }

    const { monthStart, nextMonthStart } = getCurrentMonthRange();

    const results = await Transaction.aggregate([
      {
        $match: {
          userId,
          date: {
            $gte: monthStart,
            $lt: nextMonthStart,
          },
        },
      },
      {
        $group: {
          _id: {
            currency: "$currency",
            type: "$type",
          },
          totalMinor: { $sum: "$amountMinor" },
          transactionCount: { $sum: 1 },
        },
      },
    ]);

    const currencyMap = new Map();

    for (const item of results) {
      const { currency, type } = item._id;

      if (!currencyMap.has(currency)) {
        currencyMap.set(currency, {
          currency,
          incomeMinor: 0,
          expensesMinor: 0,
          incomeCount: 0,
          expenseCount: 0,
        });
      }

      const entry = currencyMap.get(currency);

      if (type === "INCOME") {
        entry.incomeMinor = item.totalMinor;
        entry.incomeCount = item.transactionCount;
      } else if (type === "EXPENSE") {
        entry.expensesMinor = item.totalMinor;
        entry.expenseCount = item.transactionCount;
      }
    }

    const data = Array.from(currencyMap.values()).map((entry) => {
      const netSavingsMinor =
        entry.incomeMinor - entry.expensesMinor;

      const savingsRatePercentage =
        entry.incomeMinor > 0
          ? calculatePercentage(netSavingsMinor, entry.incomeMinor)
          : null;

      return {
        currency: entry.currency,
        incomeMinor: entry.incomeMinor,
        expensesMinor: entry.expensesMinor,
        netSavingsMinor,
        savingsRatePercentage,
        incomeCount: entry.incomeCount,
        expenseCount: entry.expenseCount,
      };
    });

    return res.status(200).json({
      success: true,
      period: {
        from: monthStart.toISOString(),
        to: nextMonthStart.toISOString(),
        endExclusive: true,
      },
      data,
    });
  } catch (error) {
    console.error("Get savings rate insights error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve savings rate insights.",
    });
  }
};

/**
 * GET FINANCIAL HEALTH SUMMARY
 *
 * Provides a summary of the user's current-month financial activity.
 */
export const getFinancialHealthSummary = async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req);

    if (!userId) {
      return sendUnauthorized(res);
    }

    const { monthStart, nextMonthStart } = getCurrentMonthRange();

    const results = await Transaction.aggregate([
      {
        $match: {
          userId,
          date: {
            $gte: monthStart,
            $lt: nextMonthStart,
          },
        },
      },
      {
        $group: {
          _id: {
            currency: "$currency",
            type: "$type",
          },
          totalMinor: { $sum: "$amountMinor" },
        },
      },
    ]);

    const currencyMap = new Map();

    for (const item of results) {
      const { currency, type } = item._id;

      if (!currencyMap.has(currency)) {
        currencyMap.set(currency, {
          currency,
          incomeMinor: 0,
          expensesMinor: 0,
        });
      }

      const entry = currencyMap.get(currency);

      if (type === "INCOME") {
        entry.incomeMinor = item.totalMinor;
      } else if (type === "EXPENSE") {
        entry.expensesMinor = item.totalMinor;
      }
    }

    const data = Array.from(currencyMap.values()).map((entry) => {
      const netSavingsMinor =
        entry.incomeMinor - entry.expensesMinor;

      const savingsRatePercentage =
        entry.incomeMinor > 0
          ? calculatePercentage(netSavingsMinor, entry.incomeMinor)
          : null;

      const observations = [];

      if (entry.incomeMinor === 0 && entry.expensesMinor > 0) {
        observations.push(
          "Expenses were recorded, but no income was recorded this month."
        );
      } else if (entry.incomeMinor > 0) {
        if (netSavingsMinor < 0) {
          observations.push(
            "Recorded expenses exceed recorded income this month."
          );
        } else if (netSavingsMinor === 0) {
          observations.push(
            "Recorded income equals recorded expenses this month."
          );
        } else {
          observations.push(
            "Recorded income exceeds recorded expenses this month."
          );
        }
      } else {
        observations.push(
          "No income or expenses were recorded this month."
        );
      }

      return {
        currency: entry.currency,
        incomeMinor: entry.incomeMinor,
        expensesMinor: entry.expensesMinor,
        netSavingsMinor,
        savingsRatePercentage,
        observations,
      };
    });

    return res.status(200).json({
      success: true,
      period: {
        from: monthStart.toISOString(),
        to: nextMonthStart.toISOString(),
        endExclusive: true,
      },
      data,
    });
  } catch (error) {
    console.error("Get financial health summary error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve financial health summary.",
    });
  }
};
