
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

export const createExpense = async (req, res) => {
  try {
    const {
      amountMinor,
      currency,
      categoryId,
      description,
      date,
      paymentMethod,
    } = req.body;

    // Validate amount in minor currency units (paise for INR).
    if (
      !Number.isSafeInteger(amountMinor) ||
      amountMinor <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Amount must be a positive safe integer in minor currency units",
      });
    }

    // Validate and normalize currency.
    if (
      typeof currency !== "string" ||
      !/^[A-Z]{3}$/i.test(currency.trim())
    ) {
      return res.status(400).json({
        success: false,
        message: "Currency must be a valid 3-letter currency code",
      });
    }

    const normalizedCurrency = currency.trim().toUpperCase();

    // Validate date.
    if (typeof date !== "string" || date.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "A valid expense date is required",
      });
    }

    const expenseDate = new Date(date);

    if (Number.isNaN(expenseDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Expense date is invalid",
      });
    }

    // Validate optional description.
    if (
      description !== undefined &&
      (
        typeof description !== "string" ||
        description.trim().length > 500
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Description must be text with at most 500 characters",
      });
    }

    // Validate payment method.
    const normalizedPaymentMethod =
      paymentMethod === undefined
        ? "OTHER"
        : typeof paymentMethod === "string"
          ? paymentMethod.trim().toUpperCase()
          : "";

    if (!PAYMENT_METHODS.includes(normalizedPaymentMethod)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment method",
      });
    }

    // Categories are optional until the Categories API is implemented.
    let validatedCategoryId = null;

    if (categoryId !== undefined && categoryId !== null) {
      if (
        typeof categoryId !== "string" ||
        !mongoose.isValidObjectId(categoryId)
      ) {
        return res.status(400).json({
          success: false,
          message: "Category ID is invalid",
        });
      }

      const category = await Category.findOne({
        _id: categoryId,
        userId: req.user.id,
        type: "EXPENSE",
        isArchived: false,
      });

      if (!category) {
        return res.status(400).json({
          success: false,
          message: "Expense category not found or unavailable",
        });
      }

      validatedCategoryId = category._id;
    }

    // Never accept userId or transaction type from the client.
    const expense = await Transaction.create({
      userId: req.user.id,
      type: "EXPENSE",
      amountMinor,
      currency: normalizedCurrency,
      categoryId: validatedCategoryId,
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
    console.error("Create expense error:", error.message);

    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Expense data is invalid",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to create expense",
    });
  }
};



export const getExpenses = async (req, res) => {
  try {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 10);

    if (
      !Number.isSafeInteger(page) ||
      !Number.isSafeInteger(limit) ||
      page < 1 ||
      limit < 1 ||
      limit > 100
    ) {
      return res.status(400).json({
        success: false,
        message: "Page must be positive and limit must be between 1 and 100",
      });
    }

    const { from, to, paymentMethod, search } = req.query;

    // Always scope results to the authenticated user's expenses.
    const filter = {
      userId: req.user.id,
      type: "EXPENSE",
    };

    // Filter by date range.
    if (from !== undefined || to !== undefined) {
      const dateFilter = {};

      if (from !== undefined) {
        if (
          typeof from !== "string" ||
          from.trim() === "" ||
          Number.isNaN(new Date(from).getTime())
        ) {
          return res.status(400).json({
            success: false,
            message: "Invalid from date",
          });
        }

        dateFilter.$gte = new Date(from);
      }

      if (to !== undefined) {
        if (
          typeof to !== "string" ||
          to.trim() === "" ||
          Number.isNaN(new Date(to).getTime())
        ) {
          return res.status(400).json({
            success: false,
            message: "Invalid to date",
          });
        }

        dateFilter.$lte = new Date(to);

        // Treat a date-only "to" value as the end of that day.
        if (/^\d{4}-\d{2}-\d{2}$/.test(to)) {
          dateFilter.$lte.setUTCHours(23, 59, 59, 999);
        }
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

    // Filter by payment method.
    if (paymentMethod !== undefined) {
      if (typeof paymentMethod !== "string") {
        return res.status(400).json({
          success: false,
          message: "Invalid payment method",
        });
      }

      const normalizedMethod = paymentMethod.trim().toUpperCase();

      if (!PAYMENT_METHODS.includes(normalizedMethod)) {
        return res.status(400).json({
          success: false,
          message: "Invalid payment method",
        });
      }

      filter.paymentMethod = normalizedMethod;
    }

    // Search descriptions safely using an escaped regular expression.
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

      const escapedSearch = search
        .trim()
        .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

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
    console.error("Get expenses error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch expenses",
    });
  }
};



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
      data: { expense },
    });
  } catch (error) {
    console.error("Get expense by ID error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch expense",
    });
  }
};


export const updateExpense = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid expense ID",
      });
    }

    const allowedFields = [
      "amountMinor",
      "currency",
      "categoryId",
      "description",
      "date",
      "paymentMethod",
    ];

    const body = req.body;

    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body)
    ) {
      return res.status(400).json({
        success: false,
        message: "Request body must be a JSON object",
      });
    }

    const suppliedFields = Object.keys(body);

    if (suppliedFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Provide at least one field to update",
      });
    }

    const unknownFields = suppliedFields.filter(
      (field) => !allowedFields.includes(field)
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
      if (
        !Number.isSafeInteger(body.amountMinor) ||
        body.amountMinor <= 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Amount must be a positive safe integer in minor currency units",
        });
      }

      updates.amountMinor = body.amountMinor;
    }

    // Validate and normalize currency.
    if (body.currency !== undefined) {
      if (
        typeof body.currency !== "string" ||
        !/^[A-Z]{3}$/i.test(body.currency.trim())
      ) {
        return res.status(400).json({
          success: false,
          message: "Currency must be a valid 3-letter currency code",
        });
      }

      updates.currency = body.currency.trim().toUpperCase();
    }

    // Validate description.
    if (body.description !== undefined) {
      if (
        typeof body.description !== "string" ||
        body.description.trim().length > 500
      ) {
        return res.status(400).json({
          success: false,
          message: "Description must be text with at most 500 characters",
        });
      }

      updates.description = body.description.trim();
    }

    // Validate date.
    if (body.date !== undefined) {
      if (
        typeof body.date !== "string" ||
        body.date.trim() === ""
      ) {
        return res.status(400).json({
          success: false,
          message: "Expense date must be a valid date string",
        });
      }

      const expenseDate = new Date(body.date);

      if (Number.isNaN(expenseDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Expense date is invalid",
        });
      }

      updates.date = expenseDate;
    }

    // Validate payment method.
    if (body.paymentMethod !== undefined) {
      if (typeof body.paymentMethod !== "string") {
        return res.status(400).json({
          success: false,
          message: "Payment method must be text",
        });
      }

      const paymentMethod = body.paymentMethod.trim().toUpperCase();

      if (!PAYMENT_METHODS.includes(paymentMethod)) {
        return res.status(400).json({
          success: false,
          message: "Invalid payment method",
        });
      }

      updates.paymentMethod = paymentMethod;
    }

    // Categories are optional until the Categories API is available.
    if (body.categoryId !== undefined) {
      if (body.categoryId === null) {
        updates.categoryId = null;
      } else {
        if (
          typeof body.categoryId !== "string" ||
          !mongoose.isValidObjectId(body.categoryId)
        ) {
          return res.status(400).json({
            success: false,
            message: "Category ID is invalid",
          });
        }

        const category = await Category.findOne({
          _id: body.categoryId,
          userId: req.user.id,
          type: "EXPENSE",
          isArchived: false,
        });

        if (!category) {
          return res.status(400).json({
            success: false,
            message: "Expense category not found or unavailable",
          });
        }

        updates.categoryId = category._id;
      }
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
    console.error("Update expense error:", error.message);

    if (
      error.name === "ValidationError" ||
      error.name === "CastError"
    ) {
      return res.status(400).json({
        success: false,
        message: "Expense data is invalid",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to update expense",
    });
  }
};


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
    console.error("Delete expense error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to delete expense",
    });
  }
};
