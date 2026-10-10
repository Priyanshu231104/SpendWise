
import mongoose from "mongoose";

const financialGoalSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    targetAmountMinor: {
      type: Number,
      required: true,
      min: 1,
      validate: {
        validator: Number.isSafeInteger,
        message: "Target amount must be a safe integer in minor currency units.",
      },
    },

    savedAmountMinor: {
      type: Number,
      default: 0,
      min: 0,
      validate: {
        validator: Number.isSafeInteger,
        message: "Saved amount must be a safe integer in minor currency units.",
      },
    },

    currency: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      minlength: 3,
      maxlength: 3,
      match: /^[A-Z]{3}$/,
    },

    targetDate: {
      type: Date,
      default: null,
    },

    status: {
      type: String,
      enum: ["ACTIVE", "COMPLETED", "CANCELLED"],
      default: "ACTIVE",
    },
  },
  {
    timestamps: true,
  }
);

financialGoalSchema.pre("validate", function () {
  if (
    this.targetAmountMinor != null &&
    this.savedAmountMinor != null &&
    this.savedAmountMinor > this.targetAmountMinor
  ) {
    this.invalidate(
      "savedAmountMinor",
      "Saved amount cannot exceed the target amount."
    );
  }
});

financialGoalSchema.index({
  userId: 1,
  status: 1,
  targetDate: 1,
});

const FinancialGoal = mongoose.model(
  "FinancialGoal",
  financialGoalSchema
);

export default FinancialGoal;
