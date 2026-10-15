
import mongoose from "mongoose";
import RecurringTransaction from "../models/RecurringTransaction.js";
import Category from "../models/Category.js";

const isValidObjectId = (id) =>
  mongoose.isValidObjectId(id);

const parseDate = (value) => {
  if (typeof value !== "string" || value.trim() === "") {
    return undefined;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return date;
};

const validateCategory = async (categoryId, userId, type) => {
  if (categoryId === null || categoryId === undefined) {
    return true;
  }

  if (!isValidObjectId(categoryId)) {
    return false;
  }

  const category = await Category.findOne({
    _id: categoryId,
    userId,
    type,
    isArchived: false,
  }).lean();

  return Boolean(category);
};

const serializeRecurringTransaction = (transaction) => ({
  ...transaction,
  categoryId: transaction.categoryId ?? null,
});


export const createRecurringTransaction = async (req, res) => {
  try {
    const {
      type,
      amountMinor,
      currency,
      categoryId = null,
      description = "",
      frequency,
      startDate,
      nextRunAt,
      endDate = null,
    } = req.body;

    if (!["INCOME", "EXPENSE"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Type must be INCOME or EXPENSE.",
      });
    }

    if (
      !Number.isSafeInteger(amountMinor) ||
      amountMinor < 1
    ) {
      return res.status(400).json({
        success: false,
        message: "Amount must be a positive safe integer in minor currency units.",
      });
    }

    if (
      typeof currency !== "string" ||
      !/^[A-Z]{3}$/.test(currency.trim().toUpperCase())
    ) {
      return res.status(400).json({
        success: false,
        message: "Currency must be a three-letter currency code.",
      });
    }

    if (
      !["WEEKLY", "MONTHLY", "YEARLY"].includes(frequency)
    ) {
      return res.status(400).json({
        success: false,
        message: "Frequency must be WEEKLY, MONTHLY, or YEARLY.",
      });
    }

    const parsedStartDate = parseDate(startDate);
    const parsedNextRunAt = parseDate(nextRunAt);
    const parsedEndDate =
      endDate === null ? null : parseDate(endDate);

    if (!parsedStartDate || !parsedNextRunAt) {
      return res.status(400).json({
        success: false,
        message: "Valid startDate and nextRunAt are required.",
      });
    }

    if (endDate !== null && !parsedEndDate) {
      return res.status(400).json({
        success: false,
        message: "End date must be a valid date or null.",
      });
    }

    if (parsedNextRunAt < parsedStartDate) {
      return res.status(400).json({
        success: false,
        message: "Next run date cannot be before the start date.",
      });
    }

    if (
      parsedEndDate &&
      parsedEndDate < parsedStartDate
    ) {
      return res.status(400).json({
        success: false,
        message: "End date cannot be before the start date.",
      });
    }

    if (
      parsedEndDate &&
      parsedNextRunAt > parsedEndDate
    ) {
      return res.status(400).json({
        success: false,
        message: "Next run date cannot be after the end date.",
      });
    }

    if (
      typeof description !== "string" ||
      description.trim().length > 500
    ) {
      return res.status(400).json({
        success: false,
        message: "Description must be a string of at most 500 characters.",
      });
    }

    const validCategory = await validateCategory(
      categoryId,
      req.user.id,
      type
    );

    if (!validCategory) {
      return res.status(400).json({
        success: false,
        message: "Category is invalid, archived, or does not match the transaction type.",
      });
    }

    const recurringTransaction =
      await RecurringTransaction.create({
        userId: req.user.id,
        type,
        amountMinor,
        currency: currency.trim().toUpperCase(),
        categoryId,
        description: description.trim(),
        frequency,
        startDate: parsedStartDate,
        nextRunAt: parsedNextRunAt,
        endDate: parsedEndDate,
        isActive: true,
      });

    return res.status(201).json({
      success: true,
      message: "Recurring transaction schedule created successfully.",
      data: serializeRecurringTransaction(
        recurringTransaction.toObject()
      ),
    });
  } catch (error) {
    if (
      error.name === "ValidationError" ||
      error.name === "CastError"
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid recurring transaction data.",
      });
    }

    console.error("Create recurring transaction error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create recurring transaction schedule.",
    });
  }
};


export const getRecurringTransactions = async (req, res) => {
  try {
    const { type, frequency, isActive } = req.query;

    if (
      type !== undefined &&
      !["INCOME", "EXPENSE"].includes(type)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid type filter.",
      });
    }

    if (
      frequency !== undefined &&
      !["WEEKLY", "MONTHLY", "YEARLY"].includes(frequency)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid frequency filter.",
      });
    }

    if (
      isActive !== undefined &&
      !["true", "false"].includes(isActive)
    ) {
      return res.status(400).json({
        success: false,
        message: "isActive must be true or false.",
      });
    }

    const filter = {
      userId: req.user.id,
    };

    if (type !== undefined) filter.type = type;
    if (frequency !== undefined) filter.frequency = frequency;

    if (isActive !== undefined) {
      filter.isActive = isActive === "true";
    }

    const transactions = await RecurringTransaction.find(filter)
      .sort({ nextRunAt: 1, createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: transactions.length,
      data: transactions.map(serializeRecurringTransaction),
    });
  } catch (error) {
    console.error("Get recurring transactions error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve recurring transactions.",
    });
  }
};


export const getRecurringTransactionById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid recurring transaction ID.",
      });
    }

    const transaction = await RecurringTransaction.findOne({
      _id: id,
      userId: req.user.id,
    }).lean();

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Recurring transaction not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: serializeRecurringTransaction(transaction),
    });
  } catch (error) {
    console.error("Get recurring transaction error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve recurring transaction.",
    });
  }
};


export const updateRecurringTransaction = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid recurring transaction ID.",
      });
    }

    const allowedFields = [
      "type",
      "amountMinor",
      "currency",
      "categoryId",
      "description",
      "frequency",
      "startDate",
      "nextRunAt",
      "endDate",
    ];

    const suppliedFields = Object.keys(req.body);

    if (suppliedFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Provide at least one field to update.",
      });
    }

    const invalidFields = suppliedFields.filter(
      (field) => !allowedFields.includes(field)
    );

    if (invalidFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: "One or more fields cannot be updated.",
        fields: invalidFields,
      });
    }

    const transaction = await RecurringTransaction.findOne({
      _id: id,
      userId: req.user.id,
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Recurring transaction not found.",
      });
    }

    const updates = { ...req.body };

    if (updates.type !== undefined) {
      if (!["INCOME", "EXPENSE"].includes(updates.type)) {
        return res.status(400).json({
          success: false,
          message: "Type must be INCOME or EXPENSE.",
        });
      }
    }

    if (updates.amountMinor !== undefined) {
      if (
        !Number.isSafeInteger(updates.amountMinor) ||
        updates.amountMinor < 1
      ) {
        return res.status(400).json({
          success: false,
          message: "Amount must be a positive safe integer.",
        });
      }
    }

    if (updates.currency !== undefined) {
      if (
        typeof updates.currency !== "string" ||
        !/^[A-Z]{3}$/.test(updates.currency.trim().toUpperCase())
      ) {
        return res.status(400).json({
          success: false,
          message: "Currency must be a three-letter currency code.",
        });
      }

      updates.currency = updates.currency.trim().toUpperCase();
    }

    if (updates.frequency !== undefined) {
      if (!["WEEKLY", "MONTHLY", "YEARLY"].includes(updates.frequency)) {
        return res.status(400).json({
          success: false,
          message: "Invalid frequency.",
        });
      }
    }

    if (updates.description !== undefined) {
      if (
        typeof updates.description !== "string" ||
        updates.description.trim().length > 500
      ) {
        return res.status(400).json({
          success: false,
          message: "Description must be a string of at most 500 characters.",
        });
      }

      updates.description = updates.description.trim();
    }

    for (const field of ["startDate", "nextRunAt", "endDate"]) {
      if (updates[field] === undefined) continue;

      if (field === "endDate" && updates[field] === null) {
        continue;
      }

      const parsed = parseDate(updates[field]);

      if (!parsed) {
        return res.status(400).json({
          success: false,
          message: `${field} must be a valid date or null.`,
        });
      }

      updates[field] = parsed;
    }

    const nextType = updates.type ?? transaction.type;
    const nextCategoryId =
      updates.categoryId !== undefined
        ? updates.categoryId
        : transaction.categoryId;

    if (
      nextCategoryId !== null &&
      !(await validateCategory(nextCategoryId, req.user.id, nextType))
    ) {
      return res.status(400).json({
        success: false,
        message: "Category is invalid, archived, or does not match the transaction type.",
      });
    }

    const nextStartDate = updates.startDate ?? transaction.startDate;
    const nextRunAt = updates.nextRunAt ?? transaction.nextRunAt;
    const nextEndDate =
      updates.endDate !== undefined
        ? updates.endDate
        : transaction.endDate;

    if (nextRunAt < nextStartDate) {
      return res.status(400).json({
        success: false,
        message: "Next run date cannot be before the start date.",
      });
    }

    if (nextEndDate && nextEndDate < nextStartDate) {
      return res.status(400).json({
        success: false,
        message: "End date cannot be before the start date.",
      });
    }

    if (nextEndDate && nextRunAt > nextEndDate) {
      return res.status(400).json({
        success: false,
        message: "Next run date cannot be after the end date.",
      });
    }

    transaction.set(updates);
    await transaction.save();

    return res.status(200).json({
      success: true,
      message: "Recurring transaction updated successfully.",
      data: serializeRecurringTransaction(transaction.toObject()),
    });
  } catch (error) {
    if (
      error.name === "ValidationError" ||
      error.name === "CastError"
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid recurring transaction data.",
      });
    }

    console.error("Update recurring transaction error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update recurring transaction.",
    });
  }
};


export const setRecurringTransactionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid recurring transaction ID.",
      });
    }

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isActive must be a boolean.",
      });
    }

    const transaction = await RecurringTransaction.findOne({
      _id: id,
      userId: req.user.id,
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Recurring transaction not found.",
      });
    }

    transaction.isActive = isActive;
    await transaction.save();

    return res.status(200).json({
      success: true,
      message: isActive
        ? "Recurring transaction resumed successfully."
        : "Recurring transaction paused successfully.",
      data: serializeRecurringTransaction(transaction.toObject()),
    });
  } catch (error) {
    console.error("Set recurring transaction status error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update recurring transaction status.",
    });
  }
};


export const deleteRecurringTransaction = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid recurring transaction ID.",
      });
    }

    const transaction = await RecurringTransaction.findOneAndDelete({
      _id: id,
      userId: req.user.id,
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Recurring transaction not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Recurring transaction schedule deleted successfully.",
    });
  } catch (error) {
    console.error("Delete recurring transaction error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete recurring transaction.",
    });
  }
};
