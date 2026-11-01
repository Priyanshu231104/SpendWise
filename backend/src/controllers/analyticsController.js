
import mongoose from "mongoose";
import Category from "../models/Category.js";
import Transaction from "../models/Transaction.js";

const DAY_IN_MS = 24 * 60 * 60 * 1000;

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const ISO_DATETIME_PATTERN =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/;

/**
 * Parses a date-only string or ISO datetime.
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
 * Validates the requested date range.
 *
 * Date-only "to" values include the entire specified day.
 * Datetime "to" values are treated as inclusive to millisecond precision.
 */
const parseDateRange = (query) => {
  const allowedParameters = new Set(["from", "to"]);

  const unknownParameters = Object.keys(query).filter(
    (key) => !allowedParameters.has(key)
  );

  if (unknownParameters.length > 0) {
    return {
      error: `Unsupported query parameter: ${unknownParameters[0]}.`,
    };
  }

  const { from, to } = query;

  if (from === undefined || to === undefined) {
    return {
      error: "Both from and to date parameters are required.",
    };
  }

  const start = parseDate(from);
  const end = parseDate(to);

  if (!start || !end) {
    return {
      error: "Invalid from or to date.",
    };
  }

  if (start > end) {
    return {
      error: "from must be before or equal to to.",
    };
  }

  const isDateOnly =
    typeof to === "string" &&
    DATE_ONLY_PATTERN.test(to.trim());

  const endExclusive = isDateOnly
    ? new Date(end.getTime() + DAY_IN_MS)
    : new Date(end.getTime() + 1);

  if (Number.isNaN(endExclusive.getTime())) {
    return {
      error: "Invalid to date.",
    };
  }

  return {
    start,
    end,
    endExclusive,
  };
};

/**
 * Validates and converts the authenticated user's ID.
 */
const getUserObjectId = (req) => {
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
 * Returns a percentage rounded to two decimal places.
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
 * GET MONTHLY TRENDS
 *
 * Returns monthly income, expenses, and net balance
 * grouped by year, month, and currency.
 */
export const getMonthlyTrends = async (req, res) => {
  try {
    const userId = getUserObjectId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. Please log in again.",
      });
    }

    const range = parseDateRange(req.query);

    if (range.error) {
      return res.status(400).json({
        success: false,
        message: range.error,
      });
    }

    const { start, end, endExclusive } = range;

    const results = await Transaction.aggregate([
      {
        $match: {
          userId,
          date: {
            $gte: start,
            $lt: endExclusive,
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
          totalMinor: {
            $sum: "$amountMinor",
          },
          transactionCount: {
            $sum: 1,
          },
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

/**
 * GET SPENDING DISTRIBUTION
 *
 * Returns monthly expense distribution by category
 * grouped by year, month, and currency.
 */
export const getSpendingDistribution = async (req, res) => {
  try {
    const userId = getUserObjectId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. Please log in again.",
      });
    }

    const range = parseDateRange(req.query);

    if (range.error) {
      return res.status(400).json({
        success: false,
        message: range.error,
      });
    }

    const { start, end, endExclusive } = range;

    const results = await Transaction.aggregate([
      {
        $match: {
          userId,
          type: "EXPENSE",
          date: {
            $gte: start,
            $lt: endExclusive,
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
          totalMinor: {
            $sum: "$amountMinor",
          },
          transactionCount: {
            $sum: 1,
          },
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
          .map((item) => item._id.categoryId?.toString())
          .filter(Boolean)
      ),
    ].map((id) => new mongoose.Types.ObjectId(id));

    const categories =
      categoryIds.length > 0
        ? await Category.find({
            _id: { $in: categoryIds },
            userId,
          })
            .select("_id name color icon")
            .lean()
        : [];

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
        name: category ? category.name : "Uncategorized",
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
          percentage: calculatePercentage(
            category.amountMinor,
            entry.totalExpensesMinor
          ),
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

/**
 * GET SAVINGS TREND
 *
 * Returns monthly income, expenses, and net savings
 * grouped by year, month, and currency.
 */
export const getSavingsTrend = async (req, res) => {
  try {
    const userId = getUserObjectId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. Please log in again.",
      });
    }

    const range = parseDateRange(req.query);

    if (range.error) {
      return res.status(400).json({
        success: false,
        message: range.error,
      });
    }

    const { start, end, endExclusive } = range;

    const results = await Transaction.aggregate([
      {
        $match: {
          userId,
          date: {
            $gte: start,
            $lt: endExclusive,
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
          totalMinor: {
            $sum: "$amountMinor",
          },
          transactionCount: {
            $sum: 1,
          },
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
