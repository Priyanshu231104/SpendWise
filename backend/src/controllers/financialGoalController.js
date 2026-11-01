
import mongoose from "mongoose";
import FinancialGoal from "../models/FinancialGoal.js";

const GOAL_STATUSES = [
  "ACTIVE",
  "COMPLETED",
  "CANCELLED",
];

const ALLOWED_CREATE_FIELDS = [
  "name",
  "targetAmountMinor",
  "savedAmountMinor",
  "currency",
  "targetDate",
];

const ALLOWED_UPDATE_FIELDS = [
  ...ALLOWED_CREATE_FIELDS,
  "status",
];

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

const isValidObjectId = (id) => {
  return (
    typeof id === "string" &&
    /^[a-fA-F0-9]{24}$/.test(id)
  );
};

const getUnknownFields = (body, allowedFields) => {
  return Object.keys(body).filter(
    (field) => !allowedFields.includes(field)
  );
};

const parseOptionalDate = (value) => {
  if (value === null || value === "") {
    return null;
  }

  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.trim();

  if (!normalized) {
    return undefined;
  }

  // Strictly validate YYYY-MM-DD dates.
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

    if (
      date.getUTCFullYear() !== year ||
      date.getUTCMonth() !== month - 1 ||
      date.getUTCDate() !== day
    ) {
      return undefined;
    }

    return date;
  }

  // Accept ISO-style datetime strings.
  if (!/^\d{4}-\d{2}-\d{2}T/.test(normalized)) {
    return undefined;
  }

  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return date;
};

const serializeGoal = (goal) => {
  const targetAmountMinor = goal.targetAmountMinor;
  const savedAmountMinor = goal.savedAmountMinor;

  return {
    ...goal,
    progressPercentage: Number(
      ((savedAmountMinor / targetAmountMinor) * 100).toFixed(2)
    ),
    remainingAmountMinor:
      targetAmountMinor - savedAmountMinor,
  };
};

const sendValidationError = (res, error) => {
  if (
    error instanceof mongoose.Error.ValidationError ||
    error instanceof mongoose.Error.CastError
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid financial goal data.",
    });
  }

  return null;
};

// --------------------------------------------------
// CREATE FINANCIAL GOAL
// --------------------------------------------------

export const createFinancialGoal = async (req, res) => {
  try {
    if (!isValidRequestBody(req.body)) {
      return res.status(400).json({
        success: false,
        message: "Request body must be a JSON object.",
      });
    }

    const unknownFields = getUnknownFields(
      req.body,
      ALLOWED_CREATE_FIELDS
    );

    if (unknownFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: "One or more fields cannot be provided.",
        fields: unknownFields,
      });
    }

    const {
      name,
      targetAmountMinor,
      savedAmountMinor = 0,
      currency,
      targetDate = null,
    } = req.body;

    // Validate goal name.
    if (
      typeof name !== "string" ||
      name.trim().length < 2 ||
      name.trim().length > 100
    ) {
      return res.status(400).json({
        success: false,
        message: "Name must contain between 2 and 100 characters.",
      });
    }

    // Validate target amount.
    if (
      !Number.isSafeInteger(targetAmountMinor) ||
      targetAmountMinor < 1
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Target amount must be a positive safe integer in minor currency units.",
      });
    }

    // Validate saved amount.
    if (
      !Number.isSafeInteger(savedAmountMinor) ||
      savedAmountMinor < 0 ||
      savedAmountMinor > targetAmountMinor
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Saved amount must be a non-negative safe integer and cannot exceed the target.",
      });
    }

    // Validate currency.
    if (
      typeof currency !== "string" ||
      !/^[A-Z]{3}$/.test(currency.trim().toUpperCase())
    ) {
      return res.status(400).json({
        success: false,
        message: "Currency must be a three-letter currency code.",
      });
    }

    // Validate optional target date.
    const parsedTargetDate = parseOptionalDate(targetDate);

    if (parsedTargetDate === undefined) {
      return res.status(400).json({
        success: false,
        message: "Target date must be a valid date or null.",
      });
    }

    const goal = await FinancialGoal.create({
      userId: req.user.id,
      name: name.trim(),
      targetAmountMinor,
      savedAmountMinor,
      currency: currency.trim().toUpperCase(),
      targetDate: parsedTargetDate,
      status:
        savedAmountMinor === targetAmountMinor
          ? "COMPLETED"
          : "ACTIVE",
    });

    return res.status(201).json({
      success: true,
      message: "Financial goal created successfully.",
      data: serializeGoal(goal.toObject()),
    });
  } catch (error) {
    const validationResponse = sendValidationError(
      res,
      error
    );

    if (validationResponse) {
      return validationResponse;
    }

    console.error("Create financial goal error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create financial goal.",
    });
  }
};

// --------------------------------------------------
// GET ALL FINANCIAL GOALS
// --------------------------------------------------

export const getFinancialGoals = async (req, res) => {
  try {
    const { status } = req.query;

    if (
      status !== undefined &&
      (
        typeof status !== "string" ||
        !GOAL_STATUSES.includes(status)
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid status filter.",
      });
    }

    const filter = {
      userId: req.user.id,
    };

    if (status !== undefined) {
      filter.status = status;
    }

    const goals = await FinancialGoal.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: goals.length,
      data: goals.map(serializeGoal),
    });
  } catch (error) {
    console.error("Get financial goals error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve financial goals.",
    });
  }
};

// --------------------------------------------------
// GET FINANCIAL GOAL BY ID
// --------------------------------------------------

export const getFinancialGoalById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid financial goal ID.",
      });
    }

    const goal = await FinancialGoal.findOne({
      _id: id,
      userId: req.user.id,
    }).lean();

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: "Financial goal not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: serializeGoal(goal),
    });
  } catch (error) {
    console.error("Get financial goal error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve financial goal.",
    });
  }
};

// --------------------------------------------------
// UPDATE FINANCIAL GOAL
// --------------------------------------------------

export const updateFinancialGoal = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid financial goal ID.",
      });
    }

    if (!isValidRequestBody(req.body)) {
      return res.status(400).json({
        success: false,
        message: "Request body must be a JSON object.",
      });
    }

    const suppliedFields = Object.keys(req.body);

    if (suppliedFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Provide at least one field to update.",
      });
    }

    const invalidFields = getUnknownFields(
      req.body,
      ALLOWED_UPDATE_FIELDS
    );

    if (invalidFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: "One or more fields cannot be updated.",
        fields: invalidFields,
      });
    }

    // Only retrieve the authenticated user's goal.
    const currentGoal = await FinancialGoal.findOne({
      _id: id,
      userId: req.user.id,
    });

    if (!currentGoal) {
      return res.status(404).json({
        success: false,
        message: "Financial goal not found.",
      });
    }

    const updates = {};

    // Validate name.
    if (req.body.name !== undefined) {
      if (
        typeof req.body.name !== "string" ||
        req.body.name.trim().length < 2 ||
        req.body.name.trim().length > 100
      ) {
        return res.status(400).json({
          success: false,
          message: "Name must contain between 2 and 100 characters.",
        });
      }

      updates.name = req.body.name.trim();
    }

    // Validate target amount.
    if (req.body.targetAmountMinor !== undefined) {
      if (
        !Number.isSafeInteger(req.body.targetAmountMinor) ||
        req.body.targetAmountMinor < 1
      ) {
        return res.status(400).json({
          success: false,
          message: "Target amount must be a positive safe integer.",
        });
      }

      updates.targetAmountMinor =
        req.body.targetAmountMinor;
    }

    // Validate saved amount.
    if (req.body.savedAmountMinor !== undefined) {
      if (
        !Number.isSafeInteger(req.body.savedAmountMinor) ||
        req.body.savedAmountMinor < 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Saved amount must be a non-negative safe integer.",
        });
      }

      updates.savedAmountMinor =
        req.body.savedAmountMinor;
    }

    // Validate currency.
    if (req.body.currency !== undefined) {
      if (
        typeof req.body.currency !== "string" ||
        !/^[A-Z]{3}$/.test(
          req.body.currency.trim().toUpperCase()
        )
      ) {
        return res.status(400).json({
          success: false,
          message: "Currency must be a three-letter currency code.",
        });
      }

      updates.currency =
        req.body.currency.trim().toUpperCase();
    }

    // Validate optional target date.
    if (req.body.targetDate !== undefined) {
      const parsedDate = parseOptionalDate(
        req.body.targetDate
      );

      if (parsedDate === undefined) {
        return res.status(400).json({
          success: false,
          message: "Target date must be a valid date or null.",
        });
      }

      updates.targetDate = parsedDate;
    }

    // Validate status.
    if (req.body.status !== undefined) {
      if (!GOAL_STATUSES.includes(req.body.status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid financial goal status.",
        });
      }

      updates.status = req.body.status;
    }

    // Validate the combined target and saved amounts.
    const targetAmountMinor =
      updates.targetAmountMinor ??
      currentGoal.targetAmountMinor;

    const savedAmountMinor =
      updates.savedAmountMinor ??
      currentGoal.savedAmountMinor;

    if (savedAmountMinor > targetAmountMinor) {
      return res.status(400).json({
        success: false,
        message: "Saved amount cannot exceed the target amount.",
      });
    }

    // Keep completion status consistent with the amounts.
    if (updates.status === "COMPLETED") {
      if (savedAmountMinor !== targetAmountMinor) {
        return res.status(400).json({
          success: false,
          message:
            "A goal can only be completed when its saved amount reaches its target.",
        });
      }
    } else if (updates.status === undefined) {
      if (savedAmountMinor === targetAmountMinor) {
        updates.status = "COMPLETED";
      } else if (currentGoal.status === "COMPLETED") {
        updates.status = "ACTIVE";
      }
    }

    currentGoal.set(updates);

    await currentGoal.save();

    return res.status(200).json({
      success: true,
      message: "Financial goal updated successfully.",
      data: serializeGoal(currentGoal.toObject()),
    });
  } catch (error) {
    const validationResponse = sendValidationError(
      res,
      error
    );

    if (validationResponse) {
      return validationResponse;
    }

    console.error("Update financial goal error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update financial goal.",
    });
  }
};

// --------------------------------------------------
// DELETE FINANCIAL GOAL
// --------------------------------------------------

export const deleteFinancialGoal = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid financial goal ID.",
      });
    }

    const goal = await FinancialGoal.findOneAndDelete({
      _id: id,
      userId: req.user.id,
    });

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: "Financial goal not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Financial goal deleted successfully.",
    });
  } catch (error) {
    console.error("Delete financial goal error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete financial goal.",
    });
  }
};
