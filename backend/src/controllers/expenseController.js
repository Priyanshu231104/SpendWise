
import mongoose from "mongoose";

import Transaction from "../models/Transaction.js";
import Category from "../models/Category.js";

const PAYMENT_METHODS = [
  "CASH",
  "UPI",
  "CARD",
  "BANK_TRANSFER",
  "OTHER",
];

const CREATE_FIELDS = [
  "amountMinor",
  "currency",
  "categoryId",
  "description",
  "date",
  "paymentMethod",
];

const UPDATE_FIELDS = CREATE_FIELDS;

// --------------------------------------------------
// SHARED VALIDATION HELPERS
// --------------------------------------------------

const isValidRequestBody = (body) => {
  return (
    body !== null &&
    typeof body === "object" &&
    !Array.isArray(body)
  );
};

const parseDate = (value) => {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  const normalized = value.trim();

  // Strictly validate date-only values to avoid rollover dates.
  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    const parsed = new Date(`${normalized}T00:00:00.000Z`);

    if (
      Number.isNaN(parsed.getTime()) ||
      parsed.toISOString().slice(0, 10) !== normalized
    ) {
      return null;
    }

    return parsed;
  }

  const parsed = new Date(normalized);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const normalizeCurrency = (currency) => {
  if (
    typeof currency !== "string" ||
    !/^[A-Z]{3}$/i.test(currency.trim())
  ) {
    return null;
  }

  return currency.trim().toUpperCase();
};

const normalizePaymentMethod = (paymentMethod) => {
  if (typeof paymentMethod !== "string") {
    return null;
  }

  const normalized = paymentMethod.trim().toUpperCase();

  return PAYMENT_METHODS.includes(normalized)
    ? normalized
    : null;
};

const hasUnknownFields = (body, allowedFields) => {
  return Object.keys(body).filter(
    (field) => !allowedFields.includes(field)
  );
};

const isValidAmount = (amountMinor) => {
  return (
    Number.isSafeInteger(amountMinor) &&
    amountMinor > 0
  );
};

const escapeRegex = (value) => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

const handleValidationError = (error, res, action) => {
  if (
    error.name === "ValidationError" ||
    error.name === "CastError"
  ) {
    return res.status(400).json({
      success: false,
      message: "Expense data is invalid",
    });
  }

  console.error(`${action} error:`, error);

  return res.status(500).json({
    success: false,
    message: `Unable to ${action.toLowerCase()}`,
  });
};

const validateCategory = async (categoryId, userId) => {
  if (categoryId === undefined || categoryId === null) {
    return {
      valid: true,
      categoryId: null,
    };
  }

  if (
    typeof categoryId !== "string" ||
    !mongoose.isValidObjectId(categoryId)
  ) {
    return {
      valid: false,
      categoryId: null,
    };
  }

  const category = await Category.findOne({
    _id: categoryId,
    userId,
    type: "EXPENSE",
    isArchived: false,
  }).select("_id");

  if (!category) {
    return {
      valid: false,
      categoryId: null,
    };
  }

  return {
    valid: true,
    categoryId: category._id,
  };
};

// --------------------------------------------------
// CREATE EXPENSE
// --------------------------------------------------

export const createExpense = async (req, res) => {
  try {
    if (!isValidRequestBody(req.body)) {
      return res.status(400).json({
        success: false,
        message: "Request body must be a JSON object",
      });
    }

    const unknownFields = hasUnknownFields(
      req.body,
      CREATE_FIELDS
    );

    if (unknownFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: "One or more fields cannot be provided",
        fields: unknownFields,
      });
    }

    const {
      amountMinor,
      currency,
      categoryId,
      description,
      date,
      paymentMethod,
    } = req.body;

    // Validate amount.
    if (!isValidAmount(amountMinor)) {
      return res.status(400).json({
        success: false,
        message:
          "Amount must be a positive safe integer in minor currency units",
      });
    }

    // Validate currency.
    const normalizedCurrency = normalizeCurrency(currency);

    if (!normalizedCurrency) {
      return res.status(400).json({
        success: false,
        message: "Currency must be a valid 3-letter currency code",
      });
    }

    // Validate date.
    const expenseDate = parseDate(date);

    if (!expenseDate) {
      return res.status(400).json({
        success: false,
        message: "Expense date is invalid",
      });
    }

    // Validate description.
    if (
      description !== undefined &&
      (
        typeof description !== "string" ||
        description.trim().length > 500
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Description must be text with at most 500 characters",
      });
    }

    // Validate payment method.
    const normalizedPaymentMethod =
      paymentMethod === undefined
        ? "OTHER"
        : normalizePaymentMethod(paymentMethod);

    if (!normalizedPaymentMethod) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment method",
      });
    }

    // Validate category ownership and type.
    const categoryResult = await validateCategory(
      categoryId,
      req.user.id
    );

    if (!categoryResult.valid) {
      return res.status(400).json({
        success: false,
        message: "Expense category not found or unavailable",
      });
    }

    // Never accept userId or transaction type from the client.
    const expense = await Transaction.create({
      userId: req.user.id,
      type: "EXPENSE",
      amountMinor,
      currency: normalizedCurrency,
      categoryId: categoryResult.categoryId,
      description: description?.trim() ?? "",
      date: expenseDate,
      paymentMethod: normalizedPaymentMethod,
    });

    return res.status(201).json({
      success: true,
      message: "Expense created successfully",
      data: {
        expense,
      },
    });
  } catch (error) {
    return handleValidationError(
      error,
      res,
      "Create expense"
    );
  }
};

// --------------------------------------------------
// GET ALL EXPENSES
// --------------------------------------------------

export const getExpenses = async (req, res) => {
  try {
    const { page: rawPage = "1", limit: rawLimit = "10" } =
      req.query;

    if (
      typeof rawPage !== "string" ||
      typeof rawLimit !== "string" ||
      !/^\d+$/.test(rawPage) ||
      !/^\d+$/.test(rawLimit)
    ) {
      return res.status(400).json({
        success: false,
        message: "Page and limit must be positive integers",
      });
    }

    const page = Number(rawPage);
    const limit = Number(rawLimit);

    if (
      !Number.isSafeInteger(page) ||
      !Number.isSafeInteger(limit) ||
      page < 1 ||
      limit < 1 ||
      limit > 100 ||
      !Number.isSafeInteger((page - 1) * limit)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Page must be positive and limit must be between 1 and 100",
      });
    }

    const { from, to, paymentMethod, search } = req.query;

    // Always scope results to the authenticated user.
    const filter = {
      userId: req.user.id,
      type: "EXPENSE",
    };

    // Date range filter.
    if (from !== undefined || to !== undefined) {
      const dateFilter = {};

      if (from !== undefined) {
        if (typeof from !== "string") {
          return res.status(400).json({
            success: false,
            message: "Invalid from date",
          });
        }

        const fromDate = parseDate(from);

        if (!fromDate) {
          return res.status(400).json({
            success: false,
            message: "Invalid from date",
          });
        }

        dateFilter.$gte = fromDate;
      }

      if (to !== undefined) {
        if (typeof to !== "string") {
          return res.status(400).json({
            success: false,
            message: "Invalid to date",
          });
        }

        const toDate = parseDate(to);

        if (!toDate) {
          return res.status(400).json({
            success: false,
            message: "Invalid to date",
          });
        }

        // Include the entire UTC day for date-only values.
        if (/^\d{4}-\d{2}-\d{2}$/.test(to.trim())) {
          toDate.setUTCHours(23, 59, 59, 999);
        }

        dateFilter.$lte = toDate;
      }

      if (
        dateFilter.$gte &&
        dateFilter.$lte &&
        dateFilter.$gte > dateFilter.$lte
      ) {
        return res.status(400).json({
          success: false,
          message: "The from date must not be after the to date",
        });
      }

      filter.date = dateFilter;
    }

    // Payment method filter.
    if (paymentMethod !== undefined) {
      const normalizedMethod =
        normalizePaymentMethod(paymentMethod);

      if (!normalizedMethod) {
        return res.status(400).json({
          success: false,
          message: "Invalid payment method",
        });
      }

      filter.paymentMethod = normalizedMethod;
    }

    // Safely search expense descriptions.
    if (search !== undefined) {
      if (
        typeof search !== "string" ||
        search.trim().length === 0 ||
        search.trim().length > 100
      ) {
        return res.status(400).json({
          success: false,
          message: "Search must contain 1 to 100 characters",
        });
      }

      const escapedSearch = escapeRegex(search.trim());

      filter.description = {
        $regex: escapedSearch,
        $options: "i",
      };
    }

    const skip = (page - 1) * limit;

    const [expenses, total] = await Promise.all([
      Transaction.find(filter)
        .sort({ date: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      Transaction.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      message: "Expenses fetched successfully",
      data: {
        expenses,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Get expenses error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch expenses",
    });
  }
};

// --------------------------------------------------
// GET EXPENSE BY ID
// --------------------------------------------------

export const getExpenseById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid expense ID",
      });
    }

    const expense = await Transaction.findOne({
      _id: id,
      userId: req.user.id,
      type: "EXPENSE",
    }).lean();

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: "Expense not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Expense fetched successfully",
      data: {
        expense,
      },
    });
  } catch (error) {
    console.error("Get expense by ID error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch expense",
    });
  }
};

// --------------------------------------------------
// UPDATE EXPENSE
// --------------------------------------------------

export const updateExpense = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid expense ID",
      });
    }

    if (!isValidRequestBody(req.body)) {
      return res.status(400).json({
        success: false,
        message: "Request body must be a JSON object",
      });
    }

    const body = req.body;
    const suppliedFields = Object.keys(body);

    if (suppliedFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Provide at least one field to update",
      });
    }

    const unknownFields = hasUnknownFields(
      body,
      UPDATE_FIELDS
    );

    if (unknownFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: "One or more fields cannot be updated",
        fields: unknownFields,
      });
    }

    const updates = {};

    // Validate amount.
    if (body.amountMinor !== undefined) {
      if (!isValidAmount(body.amountMinor)) {
        return res.status(400).json({
          success: false,
          message:
            "Amount must be a positive safe integer in minor currency units",
        });
      }

      updates.amountMinor = body.amountMinor;
    }

    // Validate currency.
    if (body.currency !== undefined) {
      const normalizedCurrency = normalizeCurrency(body.currency);

      if (!normalizedCurrency) {
        return res.status(400).json({
          success: false,
          message: "Currency must be a valid 3-letter currency code",
        });
      }

      updates.currency = normalizedCurrency;
    }

    // Validate description.
    if (body.description !== undefined) {
      if (
        typeof body.description !== "string" ||
        body.description.trim().length > 500
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Description must be text with at most 500 characters",
        });
      }

      updates.description = body.description.trim();
    }

    // Validate date.
    if (body.date !== undefined) {
      const expenseDate = parseDate(body.date);

      if (!expenseDate) {
        return res.status(400).json({
          success: false,
          message: "Expense date is invalid",
        });
      }

      updates.date = expenseDate;
    }

    // Validate payment method.
    if (body.paymentMethod !== undefined) {
      const normalizedMethod = normalizePaymentMethod(
        body.paymentMethod
      );

      if (!normalizedMethod) {
        return res.status(400).json({
          success: false,
          message: "Invalid payment method",
        });
      }

      updates.paymentMethod = normalizedMethod;
    }

    // Validate category.
    if (body.categoryId !== undefined) {
      const categoryResult = await validateCategory(
        body.categoryId,
        req.user.id
      );

      if (!categoryResult.valid) {
        return res.status(400).json({
          success: false,
          message: "Expense category not found or unavailable",
        });
      }

      updates.categoryId = categoryResult.categoryId;
    }

    const expense = await Transaction.findOneAndUpdate(
      {
        _id: id,
        userId: req.user.id,
        type: "EXPENSE",
      },
      {
        $set: updates,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: "Expense not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Expense updated successfully",
      data: {
        expense,
      },
    });
  } catch (error) {
    return handleValidationError(
      error,
      res,
      "Update expense"
    );
  }
};

// --------------------------------------------------
// DELETE EXPENSE
// --------------------------------------------------

export const deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid expense ID",
      });
    }

    // Delete only an expense owned by the authenticated user.
    const expense = await Transaction.findOneAndDelete({
      _id: id,
      userId: req.user.id,
      type: "EXPENSE",
    });

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: "Expense not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Expense deleted successfully",
      data: {
        deletedExpenseId: expense._id,
      },
    });
  } catch (error) {
    console.error("Delete expense error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to delete expense",
    });
  }
};
