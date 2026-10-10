
import mongoose from "mongoose";

const budgetSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    name: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "",
    },

    amountMinor: {
      type: Number,
      required: true,
      min: 1,
      validate: {
        validator: Number.isSafeInteger,
        message: "Budget amount must be a safe integer in minor currency units.",
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

    periodStart: {
      type: Date,
      required: true,
    },

    periodEnd: {
      type: Date,
      required: true,
    },

    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

budgetSchema.pre("validate", function () {
  if (
    this.periodStart &&
    this.periodEnd &&
    this.periodEnd <= this.periodStart
  ) {
    this.invalidate(
      "periodEnd",
      "Budget period end must be after its start."
    );
  }
});


budgetSchema.index(
  { userId: 1, periodStart: 1 },
  {
    unique: true,
    partialFilterExpression: { categoryId: null },
    name: "unique_overall_budget_per_period",
  }
);

budgetSchema.index(
  { userId: 1, categoryId: 1, periodStart: 1 },
  {
    unique: true,
    partialFilterExpression: {
      categoryId: { $type: "objectId" },
    },
    name: "unique_category_budget_per_period",
  }
);


const Budget = mongoose.model("Budget", budgetSchema);

export default Budget;
