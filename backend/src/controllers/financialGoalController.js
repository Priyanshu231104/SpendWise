
import mongoose from "mongoose";
import FinancialGoal from "../models/FinancialGoal.js";

const isValidObjectId = (id) => mongoose.isValidObjectId(id);

const parseOptionalDate = (value) => {
  if (value === null || value === "") {
    return null;
  }

  if (typeof value !== "string") {
    return undefined;
  }

  const date = new Date(value);

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
    remainingAmountMinor: targetAmountMinor - savedAmountMinor,
  };
};


export const createFinancialGoal = async (req, res) => {
  try {
    const {
      name,
      targetAmountMinor,
      savedAmountMinor = 0,
      currency,
      targetDate = null,
    } = req.body;

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

    if (
      !Number.isSafeInteger(targetAmountMinor) ||
      targetAmountMinor < 1
    ) {
      return res.status(400).json({
        success: false,
        message: "Target amount must be a positive safe integer in minor currency units.",
      });
    }

    if (
      !Number.isSafeInteger(savedAmountMinor) ||
      savedAmountMinor < 0 ||
      savedAmountMinor > targetAmountMinor
    ) {
      return res.status(400).json({
        success: false,
        message: "Saved amount must be a non-negative safe integer and cannot exceed the target.",
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

    const parsedTargetDate = parseOptionalDate(targetDate);

    if (targetDate !== null && parsedTargetDate === undefined) {
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
    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid financial goal data.",
      });
    }

    console.error("Create financial goal error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create financial goal.",
    });
  }
};


export const getFinancialGoals = async (req, res) => {
  try {
    const { status } = req.query;

    const allowedStatuses = ["ACTIVE", "COMPLETED", "CANCELLED"];

    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status filter.",
      });
    }

    const filter = {
      userId: req.user.id,
    };

    if (status) {
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


export const updateFinancialGoal = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid financial goal ID.",
      });
    }

    const allowedFields = [
      "name",
      "targetAmountMinor",
      "savedAmountMinor",
      "currency",
      "targetDate",
      "status",
    ];

    const updates = {};
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

      updates.targetAmountMinor = req.body.targetAmountMinor;
    }

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

      updates.savedAmountMinor = req.body.savedAmountMinor;
    }

    if (req.body.currency !== undefined) {
      if (
        typeof req.body.currency !== "string" ||
        !/^[A-Z]{3}$/.test(req.body.currency.trim().toUpperCase())
      ) {
        return res.status(400).json({
          success: false,
          message: "Currency must be a three-letter currency code.",
        });
      }

      updates.currency = req.body.currency.trim().toUpperCase();
    }

    if (req.body.targetDate !== undefined) {
      const parsedDate = parseOptionalDate(req.body.targetDate);

      if (parsedDate === undefined) {
        return res.status(400).json({
          success: false,
          message: "Target date must be a valid date or null.",
        });
      }

      updates.targetDate = parsedDate;
    }

    if (req.body.status !== undefined) {
      if (
        !["ACTIVE", "COMPLETED", "CANCELLED"].includes(req.body.status)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid financial goal status.",
        });
      }

      updates.status = req.body.status;
    }

    const targetAmountMinor =
      updates.targetAmountMinor ?? currentGoal.targetAmountMinor;

    const savedAmountMinor =
      updates.savedAmountMinor ?? currentGoal.savedAmountMinor;

    if (savedAmountMinor > targetAmountMinor) {
      return res.status(400).json({
        success: false,
        message: "Saved amount cannot exceed the target amount.",
      });
    }

    if (updates.status === undefined) {
      updates.status =
        savedAmountMinor === targetAmountMinor
          ? "COMPLETED"
          : currentGoal.status === "COMPLETED"
            ? "ACTIVE"
            : currentGoal.status;
    }

    currentGoal.set(updates);

    await currentGoal.save();

    return res.status(200).json({
      success: true,
      message: "Financial goal updated successfully.",
      data: serializeGoal(currentGoal.toObject()),
    });
  } catch (error) {
    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid financial goal data.",
      });
    }

    console.error("Update financial goal error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update financial goal.",
    });
  }
};


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
