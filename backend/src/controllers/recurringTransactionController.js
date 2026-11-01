
import mongoose from "mongoose";
import RecurringTransaction from "../models/RecurringTransaction.js";
import Category from "../models/Category.js";

const VALID_TYPES = ["INCOME", "EXPENSE"];
const VALID_FREQUENCIES = ["WEEKLY", "MONTHLY", "YEARLY"];

const CREATE_FIELDS = [
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

const UPDATE_FIELDS = CREATE_FIELDS;

const isValidObjectId = (id) =>
  typeof id === "string" && mongoose.isValidObjectId(id);

const isPlainObject = (value) =>
  value !== null &&
  typeof value === "object" &&
  !Array.isArray(value) &&
  (Object.getPrototypeOf(value) === Object.prototype ||
    Object.getPrototypeOf(value) === null);

const hasOnlyAllowedFields = (body, allowedFields) =>
  Object.keys(body).every((field) => allowedFields.includes(field));

const parseDate = (value) => {
  if (typeof value !== "string" || value.trim() === "") {
    return null;
  }

  const normalizedValue = value.trim();

  // Accept ISO date-only values or ISO datetime values.
  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(normalizedValue);

  const isDateTime =
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/.test(
      normalizedValue
    );

  if (!isDateOnly && !isDateTime) {
    return null;
  }

  // Strictly validate calendar dates instead of accepting rollover dates.
  const datePart = normalizedValue.slice(0, 10);
  const [year, month, day] = datePart.split("-").map(Number);

  const calendarDate = new Date(Date.UTC(year, month - 1, day));

  if (
    calendarDate.getUTCFullYear() !== year ||
    calendarDate.getUTCMonth() !== month - 1 ||
    calendarDate.getUTCDate() !== day
  ) {
    return null;
  }

  if (isDateOnly) {
    return calendarDate;
  }

  const date = new Date(normalizedValue);

  if (Number.isNaN(date.getTime())) {
    return null;
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
  })
    .select("_id")
    .lean();

  return Boolean(category);
};

const serializeRecurringTransaction = (transaction) => ({
  ...transaction,
  categoryId: transaction.categoryId ?? null,
});

const validateScheduleDates = ({
  startDate,
  nextRunAt,
  endDate,
}) => {
  if (!(startDate instanceof Date) || Number.isNaN(startDate.getTime())) {
    return "A valid startDate is required.";
  }

  if (!(nextRunAt instanceof Date) || Number.isNaN(nextRunAt.getTime())) {
    return "A valid nextRunAt is required.";
  }

  if (nextRunAt < startDate) {
    return "Next run date cannot be before the start date.";
  }

  if (endDate !== null && endDate !== undefined) {
    if (!(endDate instanceof Date) || Number.isNaN(endDate.getTime())) {
      return "End date must be a valid date or null.";
    }

    if (endDate < startDate) {
      return "End date cannot be before the start date.";
    }

    if (nextRunAt > endDate) {
      return "Next run date cannot be after the end date.";
    }
  }

  return null;
};

const isValidAmount = (amountMinor) =>
  Number.isSafeInteger(amountMinor) && amountMinor > 0;

const isValidCurrency = (currency) =>
  typeof currency === "string" &&
  /^[A-Z]{3}$/.test(currency.trim().toUpperCase());

const isValidDescription = (description) =>
  typeof description === "string" &&
  description.trim().length <= 500;

const handleValidationError = (error, res, fallbackMessage) => {
  if (
    error?.name === "ValidationError" ||
    error?.name === "CastError"
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid recurring transaction data.",
    });
  }

  console.error(fallbackMessage, error);

  return res.status(500).json({
    success: false,
    message: fallbackMessage,
  });
};

// CREATE RECURRING TRANSACTION
export const createRecurringTransaction = async (req, res) => {
  try {
    if (!isPlainObject(req.body)) {
      return res.status(400).json({
        success: false,
        message: "Request body must be a valid JSON object.",
      });
    }

    const invalidFields = Object.keys(req.body).filter(
      (field) => !CREATE_FIELDS.includes(field)
    );

    if (invalidFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: "One or more fields are not allowed.",
        fields: invalidFields,
      });
    }

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

    if (!VALID_TYPES.includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Type must be INCOME or EXPENSE.",
      });
    }

    if (!isValidAmount(amountMinor)) {
      return res.status(400).json({
        success: false,
        message:
          "Amount must be a positive safe integer in minor currency units.",
      });
    }

    if (!isValidCurrency(currency)) {
      return res.status(400).json({
        success: false,
        message: "Currency must be a three-letter currency code.",
      });
    }

    if (!VALID_FREQUENCIES.includes(frequency)) {
      return res.status(400).json({
        success: false,
        message: "Frequency must be WEEKLY, MONTHLY, or YEARLY.",
      });
    }

    if (!isValidDescription(description)) {
      return res.status(400).json({
        success: false,
        message:
          "Description must be a string of at most 500 characters.",
      });
    }

    if (
      categoryId !== null &&
      categoryId !== undefined &&
      !isValidObjectId(categoryId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID.",
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

    const scheduleError = validateScheduleDates({
      startDate: parsedStartDate,
      nextRunAt: parsedNextRunAt,
      endDate: parsedEndDate,
    });

    if (scheduleError) {
      return res.status(400).json({
        success: false,
        message: scheduleError,
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
        message:
          "Category is invalid, archived, or does not match the transaction type.",
      });
    }

    const recurringTransaction = await RecurringTransaction.create({
      userId: req.user.id,
      type,
      amountMinor,
      currency: currency.trim().toUpperCase(),
      categoryId: categoryId ?? null,
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
    return handleValidationError(
      error,
      res,
      "Create recurring transaction error:"
    );
  }
};

// GET ALL RECURRING TRANSACTIONS
export const getRecurringTransactions = async (req, res) => {
  try {
    const allowedQueryFields = ["type", "frequency", "isActive"];

    const invalidFields = Object.keys(req.query).filter(
      (field) => !allowedQueryFields.includes(field)
    );

    if (invalidFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: "One or more query filters are not supported.",
        fields: invalidFields,
      });
    }

    const { type, frequency, isActive } = req.query;

    if (type !== undefined && !VALID_TYPES.includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid type filter.",
      });
    }

    if (
      frequency !== undefined &&
      !VALID_FREQUENCIES.includes(frequency)
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

// GET RECURRING TRANSACTION BY ID
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

// UPDATE RECURRING TRANSACTION
export const updateRecurringTransaction = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid recurring transaction ID.",
      });
    }

    if (!isPlainObject(req.body)) {
      return res.status(400).json({
        success: false,
        message: "Request body must be a valid JSON object.",
      });
    }

    const suppliedFields = Object.keys(req.body);

    if (suppliedFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Provide at least one field to update.",
      });
    }

    const invalidFields = suppliedFields.filter(
      (field) => !UPDATE_FIELDS.includes(field)
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

    const nextType = updates.type ?? transaction.type;

    if (!VALID_TYPES.includes(nextType)) {
      return res.status(400).json({
        success: false,
        message: "Type must be INCOME or EXPENSE.",
      });
    }

    if (
      updates.amountMinor !== undefined &&
      !isValidAmount(updates.amountMinor)
    ) {
      return res.status(400).json({
        success: false,
        message: "Amount must be a positive safe integer.",
      });
    }

    if (updates.currency !== undefined) {
      if (!isValidCurrency(updates.currency)) {
        return res.status(400).json({
          success: false,
          message: "Currency must be a three-letter currency code.",
        });
      }

      updates.currency = updates.currency.trim().toUpperCase();
    }

    if (updates.frequency !== undefined) {
      if (!VALID_FREQUENCIES.includes(updates.frequency)) {
        return res.status(400).json({
          success: false,
          message: "Invalid frequency.",
        });
      }
    }

    if (updates.description !== undefined) {
      if (!isValidDescription(updates.description)) {
        return res.status(400).json({
          success: false,
          message:
            "Description must be a string of at most 500 characters.",
        });
      }

      updates.description = updates.description.trim();
    }

    if (updates.categoryId !== undefined) {
      if (
        updates.categoryId !== null &&
        !isValidObjectId(updates.categoryId)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid category ID.",
        });
      }
    }

    for (const field of ["startDate", "nextRunAt", "endDate"]) {
      if (updates[field] === undefined) continue;

      if (field === "endDate" && updates[field] === null) {
        continue;
      }

      const parsedDate = parseDate(updates[field]);

      if (!parsedDate) {
        return res.status(400).json({
          success: false,
          message: `${field} must be a valid ISO date or datetime.`,
        });
      }

      updates[field] = parsedDate;
    }

    const nextCategoryId =
      updates.categoryId !== undefined
        ? updates.categoryId
        : transaction.categoryId;

    // Validate the category against the resulting transaction type.
    if (
      nextCategoryId !== null &&
      nextCategoryId !== undefined
    ) {
      const validCategory = await validateCategory(
        nextCategoryId,
        req.user.id,
        nextType
      );

      if (!validCategory) {
        return res.status(400).json({
          success: false,
          message:
            "Category is invalid, archived, or does not match the transaction type.",
        });
      }
    }

    const nextStartDate =
      updates.startDate !== undefined
        ? updates.startDate
        : transaction.startDate;

    const nextRunAt =
      updates.nextRunAt !== undefined
        ? updates.nextRunAt
        : transaction.nextRunAt;

    const nextEndDate =
      updates.endDate !== undefined
        ? updates.endDate
        : transaction.endDate;

    const scheduleError = validateScheduleDates({
      startDate: nextStartDate,
      nextRunAt,
      endDate: nextEndDate,
    });

    if (scheduleError) {
      return res.status(400).json({
        success: false,
        message: scheduleError,
      });
    }

    // Apply only validated fields.
    transaction.set(updates);

    await transaction.save();

    return res.status(200).json({
      success: true,
      message: "Recurring transaction updated successfully.",
      data: serializeRecurringTransaction(transaction.toObject()),
    });
  } catch (error) {
    return handleValidationError(
      error,
      res,
      "Update recurring transaction error:"
    );
  }
};

// PAUSE OR RESUME RECURRING TRANSACTION
export const setRecurringTransactionStatus = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid recurring transaction ID.",
      });
    }

    if (!isPlainObject(req.body)) {
      return res.status(400).json({
        success: false,
        message: "Request body must be a valid JSON object.",
      });
    }

    const suppliedFields = Object.keys(req.body);

    if (
      suppliedFields.length !== 1 ||
      suppliedFields[0] !== "isActive"
    ) {
      return res.status(400).json({
        success: false,
        message: "Only the isActive field is allowed.",
      });
    }

    const { isActive } = req.body;

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
    return handleValidationError(
      error,
      res,
      "Set recurring transaction status error:"
    );
  }
};

// DELETE RECURRING TRANSACTION
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
