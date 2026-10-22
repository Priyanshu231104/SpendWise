
import mongoose from "mongoose";
import Transaction from "../models/Transaction.js";
import Category from "../models/Category.js";
import Budget from "../models/Budget.js";

const DAY_IN_MS = 24 * 60 * 60 * 1000;

const parseDate = (value) => {
  if (typeof value !== "string" || value.trim() === "") {
    return null;
  }

  const input = value.trim();
  const dateOnlyPattern = /^\d{4}-\d{2}-\d{2}$/;

  if (dateOnlyPattern.test(input)) {
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

  const date = new Date(input);

  return Number.isNaN(date.getTime()) ? null : date;
};

const parseDateRange = (query) => {
  const { from, to } = query;

  if (from === undefined || to === undefined) {
    return {
      error: "Both from and to date parameters are required.",
    };
  }

  const start = parseDate(from);
  const end = parseDate(to);

  if (!start || !end) {
    return { error: "Invalid from or to date." };
  }

  if (start > end) {
    return {
      error: "from must be before or equal to to.",
    };
  }

  const isDateOnly =
    typeof to === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(to.trim());

  const endExclusive = isDateOnly
    ? new Date(end.getTime() + DAY_IN_MS)
    : new Date(end.getTime() + 1);

  return { start, end, endExclusive };
};

const getUserObjectId = (userId) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error("Invalid authenticated user ID.");
  }

  return new mongoose.Types.ObjectId(userId);
};

export const getFinancialReportSummary = async (req, res) => {
  try {
    const range = parseDateRange(req.query);

    if (range.error) {
      return res.status(400).json({
        success: false,
        message: range.error,
      });
    }

    const { start, end, endExclusive } = range;
    const userId = getUserObjectId(req.user.id);

    const summary = await Transaction.aggregate([
      {
        $match: {
          userId,
          date: { $gte: start, $lt: endExclusive },
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
      { $sort: { currency: 1 } },
    ]);

    const data = summary.map((item) => {
      const income = item.totals.find(
        (entry) => entry.type === "INCOME"
      );

      const expense = item.totals.find(
        (entry) => entry.type === "EXPENSE"
      );

      const totalIncomeMinor = income?.amountMinor ?? 0;
      const totalExpensesMinor = expense?.amountMinor ?? 0;

      return {
        currency: item.currency,
        totalIncomeMinor,
        totalExpensesMinor,
        netBalanceMinor: totalIncomeMinor - totalExpensesMinor,
        incomeCount: income?.count ?? 0,
        expenseCount: expense?.count ?? 0,
        transactionCount:
          (income?.count ?? 0) + (expense?.count ?? 0),
      };
    });

    return res.status(200).json({
      success: true,
      filters: {
        from: start.toISOString(),
        to: end.toISOString(),
      },
      data,
    });
  } catch (error) {
    console.error("Get financial report summary error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve financial report.",
    });
  }
};

export const getCategoryBreakdownReport = async (req, res) => {
  try {
    const range = parseDateRange(req.query);

    if (range.error) {
      return res.status(400).json({
        success: false,
        message: range.error,
      });
    }

    const { start, end, endExclusive } = range;
    const userId = getUserObjectId(req.user.id);

    const breakdown = await Transaction.aggregate([
      {
        $match: {
          userId,
          type: "EXPENSE",
          date: { $gte: start, $lt: endExclusive },
        },
      },
      {
        $group: {
          _id: {
            currency: "$currency",
            categoryId: "$categoryId",
          },
          totalSpentMinor: { $sum: "$amountMinor" },
          transactionCount: { $sum: 1 },
        },
      },
      {
        $sort: {
          "_id.currency": 1,
          totalSpentMinor: -1,
        },
      },
    ]);

    const categoryIds = [
      ...new Set(
        breakdown
          .map((item) => item._id.categoryId?.toString())
          .filter(Boolean)
      ),
    ];

    const categories = await Category.find({
      _id: { $in: categoryIds },
      userId,
    })
      .select("_id name color icon")
      .lean();

    const categoryMap = new Map(
      categories.map((category) => [
        category._id.toString(),
        category,
      ])
    );

    const data = breakdown.map((item) => {
      const categoryId = item._id.categoryId?.toString() ?? null;
      const category = categoryId
        ? categoryMap.get(categoryId)
        : null;

      return {
        currency: item._id.currency,
        categoryId,
        categoryName: category?.name ?? "Uncategorized",
        color: category?.color ?? null,
        icon: category?.icon ?? null,
        totalSpentMinor: item.totalSpentMinor,
        transactionCount: item.transactionCount,
      };
    });

    return res.status(200).json({
      success: true,
      filters: {
        from: start.toISOString(),
        to: end.toISOString(),
        type: "EXPENSE",
      },
      data,
    });
  } catch (error) {
    console.error("Get category breakdown report error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve category breakdown report.",
    });
  }
};

export const getBudgetPerformanceReport = async (req, res) => {
  try {
    const range = parseDateRange(req.query);

    if (range.error) {
      return res.status(400).json({
        success: false,
        message: range.error,
      });
    }

    const { start, end, endExclusive } = range;
    const userId = getUserObjectId(req.user.id);

    const budgets = await Budget.find({
      userId,
      periodStart: { $lt: endExclusive },
      periodEnd: { $gt: start },
    })
      .sort({ periodStart: -1 })
      .lean();

    const data = await Promise.all(
      budgets.map(async (budget) => {
        const rangeStart =
          budget.periodStart > start ? budget.periodStart : start;

        const rangeEndExclusive =
          budget.periodEnd < endExclusive
            ? budget.periodEnd
            : endExclusive;

        const match = {
          userId,
          type: "EXPENSE",
          currency: budget.currency,
          date: {
            $gte: rangeStart,
            $lt: rangeEndExclusive,
          },
        };

        if (budget.categoryId) {
          match.categoryId = budget.categoryId;
        }

        const [result] = await Transaction.aggregate([
          { $match: match },
          {
            $group: {
              _id: null,
              spentMinor: { $sum: "$amountMinor" },
              transactionCount: { $sum: 1 },
            },
          },
        ]);

        const spentMinor = result?.spentMinor ?? 0;
        const remainingMinor = budget.amountMinor - spentMinor;

        const percentageUsed =
          budget.amountMinor > 0
            ? Number(
                ((spentMinor / budget.amountMinor) * 100).toFixed(2)
              )
            : spentMinor > 0
              ? 100
              : 0;

        return {
          budgetId: budget._id,
          name: budget.name,
          currency: budget.currency,
          amountMinor: budget.amountMinor,
          spentMinor,
          remainingMinor,
          percentageUsed,
          transactionCount: result?.transactionCount ?? 0,
          status:
            spentMinor > budget.amountMinor
              ? "OVER_BUDGET"
              : "WITHIN_BUDGET",
          periodStart: budget.periodStart,
          periodEnd: budget.periodEnd,
          categoryId: budget.categoryId ?? null,
        };
      })
    );

    return res.status(200).json({
      success: true,
      filters: {
        from: start.toISOString(),
        to: end.toISOString(),
      },
      data,
    });
  } catch (error) {
    console.error("Get budget performance report error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve budget performance report.",
    });
  }
};
