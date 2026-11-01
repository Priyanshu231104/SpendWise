
import mongoose from "mongoose";
import Budget from "../models/Budget.js";
import Transaction from "../models/Transaction.js";

const DAY_IN_MS = 24 * 60 * 60 * 1000;

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const ISO_DATETIME_PATTERN =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/;

/**
 * Parses a date-only value or ISO datetime.
 *
 * Date-only values are interpreted as UTC dates.
 * Datetimes must include an explicit timezone.
 */
const parseDate = (value) => {
  if (typeof value !== "string" || value.trim() === "") {
    return null;
  }

  const input = value.trim();

  if (DATE_ONLY_PATTERN.test(input)) {
    const [year, month, day] = input.split("-").map(Number);

    const date = new Date(Date.UTC(year, month - 1, day));

    if (
      date.getUTCFullYear() !== year ||
      date.getUTCMonth() !== month - 1 ||
      date.getUTCDate() !== day
    ) {
      return null;
    }

    return date;
  }

  if (!ISO_DATETIME_PATTERN.test(input)) {
    return null;
  }

  const date = new Date(input);

  return Number.isNaN(date.getTime()) ? null : date;
};

/**
 * Validates and converts the authenticated user's ID.
 */
const getAuthenticatedUserId = (req) => {
  const userId = req.user?.id;

  if (
    typeof userId !== "string" ||
    !mongoose.isValidObjectId(userId)
  ) {
    return null;
  }

  return new mongoose.Types.ObjectId(userId);
};

/**
 * Calculates a percentage safely.
 */
const calculatePercentage = (amount, total) => {
  if (
    !Number.isFinite(amount) ||
    !Number.isFinite(total) ||
    total <= 0
  ) {
    return 0;
  }

  const percentage = (amount / total) * 100;

  return Number.isFinite(percentage)
    ? Number(percentage.toFixed(2))
    : 0;
};

/**
 * Retrieves budget usage for the authenticated user.
 */
const getBudgetUsage = async (userId) => {
  const budgets = await Budget.find({ userId })
    .sort({ periodStart: -1 })
    .lean();

  const results = await Promise.all(
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
            spentMinor: {
              $sum: "$amountMinor",
            },
          },
        },
      ]);

      const spentMinor = result?.spentMinor ?? 0;

      const remainingMinor =
        budget.amountMinor - spentMinor;

      const percentageUsed = calculatePercentage(
        spentMinor,
        budget.amountMinor
      );

      return {
        ...budget,
        spentMinor,
        remainingMinor,
        percentageUsed,
        status:
          spentMinor > budget.amountMinor
            ? "OVER_BUDGET"
            : "WITHIN_BUDGET",
      };
    })
  );

  return results;
};

/**
 * GET DASHBOARD SUMMARY
 *
 * Returns transaction summaries grouped by currency
 * along with budget usage information.
 *
 * Optional query parameters:
 * from - starting date
 * to   - ending date
 */
export const getDashboardSummary = async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. Please log in again.",
      });
    }

    const allowedParameters = new Set(["from", "to"]);

    const unknownParameters = Object.keys(req.query).filter(
      (key) => !allowedParameters.has(key)
    );

    if (unknownParameters.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Unsupported query parameter: ${unknownParameters[0]}.`,
      });
    }

    const { from, to } = req.query;

    const filter = {
      userId,
    };

    let start = null;
    let end = null;

    if (from !== undefined) {
      start = parseDate(from);

      if (!start) {
        return res.status(400).json({
          success: false,
          message: "Invalid from date.",
        });
      }
    }

    if (to !== undefined) {
      end = parseDate(to);

      if (!end) {
        return res.status(400).json({
          success: false,
          message: "Invalid to date.",
        });
      }
    }

    if (start && end && start > end) {
      return res.status(400).json({
        success: false,
        message: "from must be before or equal to to.",
      });
    }

    if (start || end) {
      filter.date = {};

      if (start) {
        filter.date.$gte = start;
      }

      if (end) {
        const isDateOnly =
          typeof to === "string" &&
          DATE_ONLY_PATTERN.test(to.trim());

        const endExclusive = isDateOnly
          ? new Date(end.getTime() + DAY_IN_MS)
          : new Date(end.getTime() + 1);

        if (Number.isNaN(endExclusive.getTime())) {
          return res.status(400).json({
            success: false,
            message: "Invalid to date.",
          });
        }

        filter.date.$lt = endExclusive;
      }
    }

    const summary = await Transaction.aggregate([
      {
        $match: filter,
      },
      {
        $group: {
          _id: {
            currency: "$currency",
            type: "$type",
          },
          totalMinor: {
            $sum: "$amountMinor",
          },
          transactionCount: {
            $sum: 1,
          },
        },
      },
      {
        $group: {
          _id: "$_id.currency",
          totals: {
            $push: {
              type: "$_id.type",
              amountMinor: "$totalMinor",
              count: "$transactionCount",
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          currency: "$_id",
          totals: 1,
        },
      },
      {
        $sort: {
          currency: 1,
        },
      },
    ]);

    const currencies = summary.map((item) => {
      const income = item.totals.find(
        (entry) => entry.type === "INCOME"
      );

      const expense = item.totals.find(
        (entry) => entry.type === "EXPENSE"
      );

      const totalIncomeMinor = income?.amountMinor ?? 0;

      const totalExpensesMinor = expense?.amountMinor ?? 0;

      const incomeCount = income?.count ?? 0;

      const expenseCount = expense?.count ?? 0;

      return {
        currency: item.currency,
        totalIncomeMinor,
        totalExpensesMinor,
        netBalanceMinor:
          totalIncomeMinor - totalExpensesMinor,
        incomeCount,
        expenseCount,
        transactionCount: incomeCount + expenseCount,
      };
    });

    const budgets = await getBudgetUsage(userId);

    return res.status(200).json({
      success: true,
      filters: {
        from: from ?? null,
        to: to ?? null,
      },
      data: {
        currencies,
        budgets,
      },
    });
  } catch (error) {
    console.error("Get dashboard summary error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve dashboard summary",
    });
  }
};
