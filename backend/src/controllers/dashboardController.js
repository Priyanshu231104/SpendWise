import Budget from "../models/Budget.js";
import mongoose from "mongoose";
import Transaction from "../models/Transaction.js";

const parseDate = (value) => {
  if (typeof value !== "string" || value.trim() === "") {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
};


const getBudgetUsage = async (userId) => {
  const budgets = await Budget.find({ userId })
    .sort({ periodStart: -1 })
    .lean();

  const results = await Promise.all(
    budgets.map(async (budget) => {
      const match = {
        userId: budget.userId,
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
        { $match: match },
        {
          $group: {
            _id: null,
            spentMinor: { $sum: "$amountMinor" },
          },
        },
      ]);

      const spentMinor = result?.spentMinor ?? 0;
      const remainingMinor = budget.amountMinor - spentMinor;
      const percentageUsed = Number(
        ((spentMinor / budget.amountMinor) * 100).toFixed(2)
      );

      return {
        ...budget,
        spentMinor,
        remainingMinor,
        percentageUsed,
        status: spentMinor > budget.amountMinor
          ? "OVER_BUDGET"
          : "WITHIN_BUDGET",
      };
    })
  );

  return results;
};


export const getDashboardSummary = async (req, res) => {
  try {
    const { from, to } = req.query;

    const filter = {
      userId: new mongoose.Types.ObjectId(req.user.id),
    };

    if (from !== undefined || to !== undefined) {
      const start = from !== undefined ? parseDate(from) : null;
      const end = to !== undefined ? parseDate(to) : null;

      if ((from !== undefined && !start) || (to !== undefined && !end)) {
        return res.status(400).json({
          success: false,
          message: "Invalid from or to date",
        });
      }

      if (start && end && start > end) {
        return res.status(400).json({
          success: false,
          message: "from must be before or equal to to",
        });
      }

      filter.date = {};

      if (start) filter.date.$gte = start;
      if (end) filter.date.$lte = end;
    }

    const summary = await Transaction.aggregate([
      { $match: filter },
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

    const currencies = summary.map((item) => {
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

    const budgets = await getBudgetUsage(req.user.id);

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
