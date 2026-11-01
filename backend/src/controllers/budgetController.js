
import mongoose from "mongoose";
import Budget from "../models/Budget.js";
import Category from "../models/Category.js";

const ALLOWED_BUDGET_FIELDS = [
  "name",
  "amountMinor",
  "currency",
  "periodStart",
  "periodEnd",
  "categoryId",
];

const OBJECT_ID_REGEX = /^[a-fA-F0-9]{24}$/;

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

const isValidObjectId = (value) => {
  return (
    typeof value === "string" &&
    OBJECT_ID_REGEX.test(value)
  );
};

const isValidCurrency = (currency) => {
  return (
    typeof currency === "string" &&
    /^[A-Z]{3}$/.test(currency)
  );
};

const parseDate = (value, endOfDay = false) => {
  if (typeof value !== "string" || value.trim() === "") {
    return null;
  }

  const normalized = value.trim();

  // Strictly validate YYYY-MM-DD date-only values.
  const dateOnlyMatch = normalized.match(
    /^(\d{4})-(\d{2})-(\d{2})$/
  );

  if (dateOnlyMatch) {
    const year = Number(dateOnlyMatch[1]);
    const month = Number(dateOnlyMatch[2]);
    const day = Number(dateOnlyMatch[3]);

    const date = new Date(
      Date.UTC(year, month - 1, day)
    );

    // Reject impossible calendar dates.
    if (
      date.getUTCFullYear() !== year ||
      date.getUTCMonth() !== month - 1 ||
      date.getUTCDate() !== day
    ) {
      return null;
    }

    if (endOfDay) {
      date.setUTCHours(23, 59, 59, 999);
    }

    return date;
  }

  // Accept ISO-style datetime strings.
  const isDateTime = /^\d{4}-\d{2}-\d{2}T/.test(normalized);

  if (!isDateTime) {
    return null;
  }

  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
};

const getUnknownFields = (body) => {
  return Object.keys(body).filter(
    (field) => !ALLOWED_BUDGET_FIELDS.includes(field)
  );
};

const sendBudgetValidationError = (res, error) => {
  if (
    error instanceof mongoose.Error.ValidationError
  ) {
    return res.status(400).json({
      success: false,
      message: "Budget validation failed",
      errors: Object.values(error.errors).map(
        (item) => item.message
      ),
    });
  }

  if (error instanceof mongoose.Error.CastError) {
    return res.status(400).json({
      success: false,
      message: "Budget data is invalid",
    });
  }

  return null;
};

const sendDuplicateBudgetError = (res, error) => {
  if (error?.code === 11000) {
    return res.status(409).json({
      success: false,
      message: "A budget already exists for this period and scope",
    });
  }

  return null;
};

const validateCategory = async (categoryId, userId) => {
  if (categoryId === null) {
    return {
      valid: true,
      categoryId: null,
    };
  }

  if (!isValidObjectId(categoryId)) {
    return {
      valid: false,
      message: "Invalid categoryId",
    };
  }

  const category = await Category.findOne({
    _id: categoryId,
    userId,
    type: "EXPENSE",
    isArchived: false,
  });

  if (!category) {
    return {
      valid: false,
      message: "Active expense category not found for this user",
    };
  }

  return {
    valid: true,
    categoryId: category._id,
  };
};

// --------------------------------------------------
// CREATE BUDGET
// --------------------------------------------------

export const createBudget = async (req, res) => {
  try {
    if (!isValidRequestBody(req.body)) {
      return res.status(400).json({
        success: false,
        message: "Request body must be a JSON object",
      });
    }

    const unknownFields = getUnknownFields(req.body);

    if (unknownFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Unknown field(s): ${unknownFields.join(", ")}`,
      });
    }

    const {
      name = "",
      amountMinor,
      currency,
      periodStart,
      periodEnd,
      categoryId = null,
    } = req.body;

    // Validate budget name.
    if (
      typeof name !== "string" ||
      name.trim().length > 100
    ) {
      return res.status(400).json({
        success: false,
        message: "Name must be a string of at most 100 characters",
      });
    }

    // Validate amount in minor currency units.
    if (
      !Number.isSafeInteger(amountMinor) ||
      amountMinor <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "amountMinor must be a positive safe integer",
      });
    }

    // Currency must be an uppercase three-letter code.
    if (!isValidCurrency(currency)) {
      return res.status(400).json({
        success: false,
        message: "Currency must be a three-letter uppercase code",
      });
    }

    // Validate budget period.
    const start = parseDate(periodStart);
    const end = parseDate(periodEnd);

    if (!start || !end) {
      return res.status(400).json({
        success: false,
        message: "Valid periodStart and periodEnd dates are required",
      });
    }

    if (end <= start) {
      return res.status(400).json({
        success: false,
        message: "periodEnd must be after periodStart",
      });
    }

    // Validate optional expense category.
    const categoryResult = await validateCategory(
      categoryId,
      req.user.id
    );

    if (!categoryResult.valid) {
      return res.status(400).json({
        success: false,
        message: categoryResult.message,
      });
    }

    const budget = await Budget.create({
      userId: req.user.id,
      name: name.trim(),
      amountMinor,
      currency,
      periodStart: start,
      periodEnd: end,
      categoryId: categoryResult.categoryId,
    });

    return res.status(201).json({
      success: true,
      message: "Budget created successfully",
      data: budget,
    });
  } catch (error) {
    const duplicateResponse = sendDuplicateBudgetError(
      res,
      error
    );

    if (duplicateResponse) {
      return duplicateResponse;
    }

    const validationResponse = sendBudgetValidationError(
      res,
      error
    );

    if (validationResponse) {
      return validationResponse;
    }

    console.error("Create budget error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create budget",
    });
  }
};

// --------------------------------------------------
// GET ALL BUDGETS
// --------------------------------------------------

export const getBudgets = async (req, res) => {
  try {
    const {
      page = "1",
      limit = "10",
      categoryId,
      overall,
      from,
      to,
    } = req.query;

    // Strict pagination validation.
    if (
      typeof page !== "string" ||
      !/^\d+$/.test(page) ||
      typeof limit !== "string" ||
      !/^\d+$/.test(limit)
    ) {
      return res.status(400).json({
        success: false,
        message: "page and limit must be positive integers",
      });
    }

    const pageNumber = Number(page);
    const limitNumber = Number(limit);

    if (
      !Number.isSafeInteger(pageNumber) ||
      pageNumber < 1 ||
      !Number.isSafeInteger(limitNumber) ||
      limitNumber < 1 ||
      limitNumber > 100
    ) {
      return res.status(400).json({
        success: false,
        message: "page must be >= 1 and limit must be between 1 and 100",
      });
    }

    const skip = (pageNumber - 1) * limitNumber;

    if (!Number.isSafeInteger(skip)) {
      return res.status(400).json({
        success: false,
        message: "Requested page is too large",
      });
    }

    // Category and overall filters are mutually exclusive.
    if (
      categoryId !== undefined &&
      overall !== undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "Use either categoryId or overall, not both",
      });
    }

    const filter = {
      userId: req.user.id,
    };

    // Filter overall or category-specific budgets.
    if (overall !== undefined) {
      if (
        typeof overall !== "string" ||
        (overall !== "true" && overall !== "false")
      ) {
        return res.status(400).json({
          success: false,
          message: "overall must be true or false",
        });
      }

      if (overall === "true") {
        filter.categoryId = null;
      } else {
        filter.categoryId = {
          $type: "objectId",
        };
      }
    }

    // Filter by category.
    if (categoryId !== undefined) {
      if (!isValidObjectId(categoryId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid categoryId",
        });
      }

      filter.categoryId = new mongoose.Types.ObjectId(
        categoryId
      );
    }

    // Filter by budget start date.
    if (from !== undefined || to !== undefined) {
      const start =
        from !== undefined ? parseDate(from) : null;

      const end =
        to !== undefined ? parseDate(to, true) : null;

      if (
        (from !== undefined && !start) ||
        (to !== undefined && !end)
      ) {
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

      filter.periodStart = {};

      if (start) {
        filter.periodStart.$gte = start;
      }

      if (end) {
        filter.periodStart.$lte = end;
      }
    }

    const [budgets, total] = await Promise.all([
      Budget.find(filter)
        .sort({
          periodStart: -1,
          createdAt: -1,
        })
        .skip(skip)
        .limit(limitNumber)
        .lean(),

      Budget.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: budgets,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        totalPages: Math.ceil(total / limitNumber),
      },
    });
  } catch (error) {
    console.error("Get budgets error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve budgets",
    });
  }
};

// --------------------------------------------------
// GET BUDGET BY ID
// --------------------------------------------------

export const getBudgetById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid budget ID",
      });
    }

    const budget = await Budget.findOne({
      _id: id,
      userId: req.user.id,
    }).lean();

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: "Budget not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: budget,
    });
  } catch (error) {
    console.error("Get budget by ID error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve budget",
    });
  }
};

// --------------------------------------------------
// UPDATE BUDGET
// --------------------------------------------------

export const updateBudget = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid budget ID",
      });
    }

    if (!isValidRequestBody(req.body)) {
      return res.status(400).json({
        success: false,
        message: "Request body must be a JSON object",
      });
    }

    const fields = Object.keys(req.body);

    if (fields.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one field is required",
      });
    }

    const unknownFields = getUnknownFields(req.body);

    if (unknownFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Unknown field(s): ${unknownFields.join(", ")}`,
      });
    }

    const budget = await Budget.findOne({
      _id: id,
      userId: req.user.id,
    });

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: "Budget not found",
      });
    }

    const updates = req.body;

    // Validate and update name.
    if (updates.name !== undefined) {
      if (
        typeof updates.name !== "string" ||
        updates.name.trim().length > 100
      ) {
        return res.status(400).json({
          success: false,
          message: "Name must be a string of at most 100 characters",
        });
      }

      budget.name = updates.name.trim();
    }

    // Validate and update amount.
    if (updates.amountMinor !== undefined) {
      if (
        !Number.isSafeInteger(updates.amountMinor) ||
        updates.amountMinor <= 0
      ) {
        return res.status(400).json({
          success: false,
          message: "amountMinor must be a positive safe integer",
        });
      }

      budget.amountMinor = updates.amountMinor;
    }

    // Validate and update currency.
    if (updates.currency !== undefined) {
      if (!isValidCurrency(updates.currency)) {
        return res.status(400).json({
          success: false,
          message: "Currency must be a three-letter uppercase code",
        });
      }

      budget.currency = updates.currency;
    }

    // Validate and update period start.
    if (updates.periodStart !== undefined) {
      const start = parseDate(updates.periodStart);

      if (!start) {
        return res.status(400).json({
          success: false,
          message: "Invalid periodStart date",
        });
      }

      budget.periodStart = start;
    }

    // Validate and update period end.
    if (updates.periodEnd !== undefined) {
      const end = parseDate(updates.periodEnd);

      if (!end) {
        return res.status(400).json({
          success: false,
          message: "Invalid periodEnd date",
        });
      }

      budget.periodEnd = end;
    }

    // Validate the complete period after applying updates.
    if (
      budget.periodEnd <= budget.periodStart
    ) {
      return res.status(400).json({
        success: false,
        message: "periodEnd must be after periodStart",
      });
    }

    // Update or remove category association.
    if (updates.categoryId !== undefined) {
      const categoryResult = await validateCategory(
        updates.categoryId,
        req.user.id
      );

      if (!categoryResult.valid) {
        return res.status(400).json({
          success: false,
          message: categoryResult.message,
        });
      }

      budget.categoryId = categoryResult.categoryId;
    }

    await budget.save();

    return res.status(200).json({
      success: true,
      message: "Budget updated successfully",
      data: budget,
    });
  } catch (error) {
    const duplicateResponse = sendDuplicateBudgetError(
      res,
      error
    );

    if (duplicateResponse) {
      return duplicateResponse;
    }

    const validationResponse = sendBudgetValidationError(
      res,
      error
    );

    if (validationResponse) {
      return validationResponse;
    }

    console.error("Update budget error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update budget",
    });
  }
};

// --------------------------------------------------
// DELETE BUDGET
// --------------------------------------------------

export const deleteBudget = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid budget ID",
      });
    }

    const budget = await Budget.findOneAndDelete({
      _id: id,
      userId: req.user.id,
    });

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: "Budget not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Budget deleted successfully",
    });
  } catch (error) {
    console.error("Delete budget error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete budget",
    });
  }
};
