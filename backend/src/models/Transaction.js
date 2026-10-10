
import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
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

    date: {
      type: Date,
      required: true,
    },

    paymentMethod: {
      type: String,
      enum: [
        "CASH",
        "UPI",
        "CARD",
        "BANK_TRANSFER",
        "OTHER",
      ],
      default: "OTHER",
    },
  },
  {
    timestamps: true,
  }
);

transactionSchema.index({
  userId: 1,
  date: -1,
});

transactionSchema.index({
  userId: 1,
  type: 1,
  date: -1,
});

transactionSchema.index({
  userId: 1,
  categoryId: 1,
  date: -1,
});

const Transaction = mongoose.model(
  "Transaction",
  transactionSchema
);

export default Transaction;
