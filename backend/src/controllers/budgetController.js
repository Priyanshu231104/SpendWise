
import mongoose from "mongoose";
import Budget from "../models/Budget.js";
import Category from "../models/Category.js";

const isValidCurrency = (currency) =>
  typeof currency === "string" && /^[A-Z]{3}$/.test(currency);

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

export const createBudget = async (req, res) => {
  try {
    const {
      name = "",
      amountMinor,
      currency,
      periodStart,
      periodEnd,
      categoryId = null,
    } = req.body;

    // Validate the request body.
    if (
      !req.body ||
      typeof req.body !== "object" ||
      Array.isArray(req.body)
    ) {
      return res.status(400).json({
        success: false,
        message: "Request body must be a JSON object",
      });
    }

    const allowedFields = [
      "name",
      "amountMinor",
      "currency",
      "periodStart",
      "periodEnd",
      "categoryId",
    ];

    const unknownFields = Object.keys(req.body).filter(
      (field) => !allowedFields.includes(field)
    );

    if (unknownFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Unknown field(s): ${unknownFields.join(", ")}`,
      });
    }

    // Validate the budget name.
    if (
      typeof name !== "string" ||
      name.trim().length > 100
    ) {
      return res.status(400).json({
        success: false,
        message: "Name must be a string of at most 100 characters",
      });
    }

    // Validate the amount in minor currency units.
    if (
      !Number.isSafeInteger(amountMinor) ||
      amountMinor <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "amountMinor must be a positive safe integer",
      });
    }

    // Require an uppercase three-letter currency code.
    if (!isValidCurrency(currency)) {
      return res.status(400).json({
        success: false,
        message: "Currency must be a three-letter uppercase code",
      });
    }

    // Validate the budget period.
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

    // Validate an optional category.
    let normalizedCategoryId = null;

    if (categoryId !== null) {
      if (
        typeof categoryId !== "string" ||
        !mongoose.isValidObjectId(categoryId)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid categoryId",
        });
      }

      const category = await Category.findOne({
        _id: categoryId,
        userId: req.user.id,
        isArchived: false,
      });

      if (!category) {
        return res.status(400).json({
          success: false,
          message: "Category not found, not owned by you, or archived",
        });
      }

      if (category.type !== "EXPENSE") {
        return res.status(400).json({
          success: false,
          message: "Budgets can only be associated with expense categories",
        });
      }

      normalizedCategoryId = category._id;
    }

    // Create the budget using the authenticated user's ID.
    const budget = await Budget.create({
      userId: req.user.id,
      name: name.trim(),
      amountMinor,
      currency,
      periodStart: start,
      periodEnd: end,
      categoryId: normalizedCategoryId,
    });

    return res.status(201).json({
      success: true,
      message: "Budget created successfully",
      data: budget,
    });
  } catch (error) {
    // Handle duplicate-budget unique-index violations.
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A budget already exists for this period and scope",
      });
    }

    if (error instanceof mongoose.Error.ValidationError) {
      return res.status(400).json({
        success: false,
        message: "Budget validation failed",
        errors: Object.values(error.errors).map(
          (item) => item.message
        ),
      });
    }

    console.error("Create budget error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create budget",
    });
  }
};


export const getBudgets = async (req, res) => {
  try {
    const { page = "1", limit = "10", categoryId, overall, from, to } =
      req.query;

    // Validate pagination.
    const pageNumber = Number(page);
    const limitNumber = Number(limit);

    if (
      !Number.isInteger(pageNumber) ||
      pageNumber < 1 ||
      !Number.isInteger(limitNumber) ||
      limitNumber < 1 ||
      limitNumber > 100
    ) {
      return res.status(400).json({
        success: false,
        message: "page must be >= 1 and limit must be between 1 and 100",
      });
    }

    // Validate mutually exclusive category filters.
    if (categoryId !== undefined && overall !== undefined) {
      return res.status(400).json({
        success: false,
        message: "Use either categoryId or overall, not both",
      });
    }

    const filter = {
      userId: req.user.id,
    };

    if (overall !== undefined) {
      if (overall !== "true" && overall !== "false") {
        return res.status(400).json({
          success: false,
          message: "overall must be true or false",
        });
      }

      if (overall === "true") {
        filter.categoryId = null;
      } else {
        filter.categoryId = { $ne: null };
      }
    }

    if (categoryId !== undefined) {
      if (
        typeof categoryId !== "string" ||
        !mongoose.isValidObjectId(categoryId)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid categoryId",
        });
      }

      filter.categoryId = new mongoose.Types.ObjectId(categoryId);
    }

    // Filter budgets by period start date.
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

      filter.periodStart = {};

      if (start) filter.periodStart.$gte = start;
      if (end) filter.periodStart.$lte = end;
    }

    const skip = (pageNumber - 1) * limitNumber;

    const [budgets, total] = await Promise.all([
      Budget.find(filter)
        .sort({ periodStart: -1, createdAt: -1 })
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


export const getBudgetById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate the MongoDB ObjectId.
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid budget ID",
      });
    }

    // Only retrieve budgets belonging to the authenticated user.
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


export const updateBudget = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid budget ID",
      });
    }

    if (
      !req.body ||
      typeof req.body !== "object" ||
      Array.isArray(req.body)
    ) {
      return res.status(400).json({
        success: false,
        message: "Request body must be a JSON object",
      });
    }

    const allowedFields = [
      "name",
      "amountMinor",
      "currency",
      "periodStart",
      "periodEnd",
      "categoryId",
    ];

    const fields = Object.keys(req.body);

    if (fields.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one field is required",
      });
    }

    const unknownFields = fields.filter(
      (field) => !allowedFields.includes(field)
    );

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

    if (updates.currency !== undefined) {
      if (!isValidCurrency(updates.currency)) {
        return res.status(400).json({
          success: false,
          message: "Currency must be a three-letter uppercase code",
        });
      }

      budget.currency = updates.currency;
    }

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

    if (updates.categoryId !== undefined) {
      if (updates.categoryId === null) {
        budget.categoryId = null;
      } else {
        if (
          typeof updates.categoryId !== "string" ||
          !mongoose.isValidObjectId(updates.categoryId)
        ) {
          return res.status(400).json({
            success: false,
            message: "Invalid categoryId",
          });
        }

        const category = await Category.findOne({
          _id: updates.categoryId,
          userId: req.user.id,
          isArchived: false,
          type: "EXPENSE",
        });

        if (!category) {
          return res.status(400).json({
            success: false,
            message: "Active expense category not found for this user",
          });
        }

        budget.categoryId = category._id;
      }
    }

    await budget.save();

    return res.status(200).json({
      success: true,
      message: "Budget updated successfully",
      data: budget,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A budget already exists for this period and scope",
      });
    }

    if (error instanceof mongoose.Error.ValidationError) {
      return res.status(400).json({
        success: false,
        message: "Budget validation failed",
        errors: Object.values(error.errors).map(
          (item) => item.message
        ),
      });
    }

    console.error("Update budget error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update budget",
    });
  }
};


export const deleteBudget = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
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
