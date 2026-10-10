
import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },

    nameKey: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 50,
    },

    type: {
      type: String,
      required: true,
      enum: ["INCOME", "EXPENSE"],
    },

    color: {
      type: String,
      trim: true,
      maxlength: 30,
      default: null,
    },

    icon: {
      type: String,
      trim: true,
      maxlength: 50,
      default: null,
    },

    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

categorySchema.index(
  { userId: 1, type: 1, nameKey: 1 },
  { unique: true }
);

const Category = mongoose.model("Category", categorySchema);

export default Category;
