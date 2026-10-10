
import mongoose from "mongoose";

const recurringTransactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    type: {
      type: String,
      required: true,
      enum: ["INCOME", "EXPENSE"],
    },

    amountMinor: {
      type: Number,
      required: true,
      min: 1,
      validate: {
        validator: Number.isSafeInteger,
        message: "Amount must be a safe integer in minor currency units.",
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

    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },

    frequency: {
      type: String,
      required: true,
      enum: ["WEEKLY", "MONTHLY", "YEARLY"],
    },

    startDate: {
      type: Date,
      required: true,
    },

    nextRunAt: {
      type: Date,
      required: true,
    },

    endDate: {
      type: Date,
      default: null,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

recurringTransactionSchema.pre("validate", function () {
  if (
    this.startDate &&
    this.nextRunAt &&
    this.nextRunAt < this.startDate
  ) {
    this.invalidate(
      "nextRunAt",
      "Next run date cannot be before the schedule start date."
    );
  }

  if (
    this.endDate &&
    this.startDate &&
    this.endDate < this.startDate
  ) {
    this.invalidate(
      "endDate",
      "End date cannot be before the schedule start date."
    );
  }
});

recurringTransactionSchema.index({
  userId: 1,
  isActive: 1,
  nextRunAt: 1,
});

const RecurringTransaction = mongoose.model(
  "RecurringTransaction",
  recurringTransactionSchema
);

export default RecurringTransaction;
