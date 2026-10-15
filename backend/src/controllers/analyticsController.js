import Category from "../models/Category.js";
import mongoose from "mongoose";
import Transaction from "../models/Transaction.js";

const parseDateRange = (query) => {
  const { from, to } = query;

  if (
    typeof from !== "string" ||
    typeof to !== "string" ||
    !from.trim() ||
    !to.trim()
  ) {
    return {
      error: "Both from and to date parameters are required.",
    };
  }

  const start = new Date(from);
  const end = new Date(to);

  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime())
  ) {
    return { error: "Invalid from or to date." };
  }

  if (start > end) {
    return { error: "from must be before or equal to to." };
  }

  return { start, end };
};


export const getMonthlyTrends = async (req, res) => {
  try {
    const range = parseDateRange(req.query);

    if (range.error) {
      return res.status(400).json({
        success: false,
        message: range.error,
      });
    }

    const { start, end } = range;

    const results = await Transaction.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(req.user.id),
          date: {
            $gte: start,
            $lte: end,
          },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$date" },
            month: { $month: "$date" },
            currency: "$currency",
            type: "$type",
          },
          totalMinor: { $sum: "$amountMinor" },
          transactionCount: { $sum: 1 },
        },
      },
      {
        $sort: {
          "_id.year": 1,
          "_id.month": 1,
          "_id.currency": 1,
        },
      },
    ]);

    const monthlyMap = new Map();

    for (const item of results) {
      const { year, month, currency, type } = item._id;
      const key = `${year}-${month}-${currency}`;

      if (!monthlyMap.has(key)) {
        monthlyMap.set(key, {
          year,
          month,
          currency,
          totalIncomeMinor: 0,
          totalExpensesMinor: 0,
          incomeCount: 0,
          expenseCount: 0,
        });
      }

      const entry = monthlyMap.get(key);

      if (type === "INCOME") {
        entry.totalIncomeMinor = item.totalMinor;
        entry.incomeCount = item.transactionCount;
      } else if (type === "EXPENSE") {
        entry.totalExpensesMinor = item.totalMinor;
        entry.expenseCount = item.transactionCount;
      }
    }

    const data = Array.from(monthlyMap.values()).map((entry) => ({
      ...entry,
      netBalanceMinor:
        entry.totalIncomeMinor - entry.totalExpensesMinor,
      transactionCount: entry.incomeCount + entry.expenseCount,
    }));

    return res.status(200).json({
      success: true,
      filters: {
        from: start.toISOString(),
        to: end.toISOString(),
      },
      data,
    });
  } catch (error) {
    console.error("Get monthly trends error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve monthly trends.",
    });
  }
};


export const getSpendingDistribution = async (req, res) => {
  try {
    const range = parseDateRange(req.query);

    if (range.error) {
      return res.status(400).json({
        success: false,
        message: range.error,
      });
    }

    const { start, end } = range;

    const userId = new mongoose.Types.ObjectId(req.user.id);

    const results = await Transaction.aggregate([
      {
        $match: {
          userId,
          type: "EXPENSE",
          date: {
            $gte: start,
            $lte: end,
          },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$date" },
            month: { $month: "$date" },
            currency: "$currency",
            categoryId: "$categoryId",
          },
          totalMinor: { $sum: "$amountMinor" },
          transactionCount: { $sum: 1 },
        },
      },
      {
        $sort: {
          "_id.year": 1,
          "_id.month": 1,
          "_id.currency": 1,
        },
      },
    ]);

    const categoryIds = [
      ...new Set(
        results
          .map((item) => item._id.categoryId)
          .filter((id) => id !== null)
          .map((id) => id.toString())
      ),
    ].map((id) => new mongoose.Types.ObjectId(id));

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

    const monthlyMap = new Map();

    for (const item of results) {
      const { year, month, currency, categoryId } = item._id;
      const monthKey = `${year}-${month}-${currency}`;

      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, {
          year,
          month,
          currency,
          totalExpensesMinor: 0,
          categories: [],
        });
      }

      const monthlyEntry = monthlyMap.get(monthKey);

      const category = categoryId
        ? categoryMap.get(categoryId.toString())
        : null;

      monthlyEntry.totalExpensesMinor += item.totalMinor;

      monthlyEntry.categories.push({
        categoryId: categoryId
          ? categoryId.toString()
          : null,
        name: category
          ? category.name
          : "Uncategorized",
        color: category?.color ?? null,
        icon: category?.icon ?? null,
        amountMinor: item.totalMinor,
        transactionCount: item.transactionCount,
      });
    }

    const data = Array.from(monthlyMap.values()).map((entry) => ({
      ...entry,
      categories: entry.categories
        .map((category) => ({
          ...category,
          percentage:
            entry.totalExpensesMinor > 0
              ? Number(
                  (
                    (category.amountMinor /
                      entry.totalExpensesMinor) *
                    100
                  ).toFixed(2)
                )
              : 0,
        }))
        .sort((a, b) => b.amountMinor - a.amountMinor),
    }));

    return res.status(200).json({
      success: true,
      filters: {
        from: start.toISOString(),
        to: end.toISOString(),
      },
      data,
    });
  } catch (error) {
    console.error("Get spending distribution error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve spending distribution.",
    });
  }
};


export const getSavingsTrend = async (req, res) => {
  try {
    const range = parseDateRange(req.query);

    if (range.error) {
      return res.status(400).json({
        success: false,
        message: range.error,
      });
    }

    const { start, end } = range;

    const results = await Transaction.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(req.user.id),
          date: {
            $gte: start,
            $lte: end,
          },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$date" },
            month: { $month: "$date" },
            currency: "$currency",
            type: "$type",
          },
          totalMinor: { $sum: "$amountMinor" },
          transactionCount: { $sum: 1 },
        },
      },
      {
        $sort: {
          "_id.year": 1,
          "_id.month": 1,
          "_id.currency": 1,
        },
      },
    ]);

    const monthlyMap = new Map();

    for (const item of results) {
      const { year, month, currency, type } = item._id;
      const key = `${year}-${month}-${currency}`;

      if (!monthlyMap.has(key)) {
        monthlyMap.set(key, {
          year,
          month,
          currency,
          totalIncomeMinor: 0,
          totalExpensesMinor: 0,
          incomeCount: 0,
          expenseCount: 0,
        });
      }

      const entry = monthlyMap.get(key);

      if (type === "INCOME") {
        entry.totalIncomeMinor = item.totalMinor;
        entry.incomeCount = item.transactionCount;
      } else if (type === "EXPENSE") {
        entry.totalExpensesMinor = item.totalMinor;
        entry.expenseCount = item.transactionCount;
      }
    }

    const data = Array.from(monthlyMap.values()).map((entry) => ({
      year: entry.year,
      month: entry.month,
      currency: entry.currency,
      totalIncomeMinor: entry.totalIncomeMinor,
      totalExpensesMinor: entry.totalExpensesMinor,
      netSavingsMinor:
        entry.totalIncomeMinor - entry.totalExpensesMinor,
      incomeCount: entry.incomeCount,
      expenseCount: entry.expenseCount,
      transactionCount: entry.incomeCount + entry.expenseCount,
    }));

    return res.status(200).json({
      success: true,
      filters: {
        from: start.toISOString(),
        to: end.toISOString(),
      },
      data,
    });
  } catch (error) {
    console.error("Get savings trend error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve savings trend.",
    });
  }
};
