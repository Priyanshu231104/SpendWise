
import mongoose from "mongoose";
import Category from "../models/Category.js";

const CATEGORY_TYPES = ["INCOME", "EXPENSE"];

const ALLOWED_CREATE_FIELDS = [
  "name",
  "type",
  "color",
  "icon",
];

const ALLOWED_UPDATE_FIELDS = [
  "name",
  "color",
  "icon",
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

const normalizeCategoryName = (name) => {
  if (typeof name !== "string") {
    return null;
  }

  const normalized = name.trim();

  if (normalized.length < 2 || normalized.length > 50) {
    return null;
  }

  return normalized;
};

const normalizeCategoryType = (type) => {
  if (typeof type !== "string") {
    return null;
  }

  const normalized = type.trim().toUpperCase();

  return CATEGORY_TYPES.includes(normalized)
    ? normalized
    : null;
};

const isValidColor = (color) => {
  return (
    typeof color === "string" &&
    /^#[0-9A-Fa-f]{6}$/.test(color)
  );
};

const normalizeIcon = (icon) => {
  if (typeof icon !== "string") {
    return null;
  }

  const normalized = icon.trim();

  return normalized.length <= 50
    ? normalized
    : null;
};

const getUnknownFields = (body, allowedFields) => {
  return Object.keys(body).filter(
    (field) => !allowedFields.includes(field)
  );
};

// --------------------------------------------------
// CREATE CATEGORY
// --------------------------------------------------

export const createCategory = async (req, res) => {
  try {
    if (!isValidRequestBody(req.body)) {
      return res.status(400).json({
        success: false,
        message: "Request body must be a JSON object",
      });
    }

    const unknownFields = getUnknownFields(
      req.body,
      ALLOWED_CREATE_FIELDS
    );

    if (unknownFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: "One or more fields cannot be provided",
        fields: unknownFields,
      });
    }

    const { name, type, color, icon } = req.body;

    // Validate name.
    const normalizedName = normalizeCategoryName(name);

    if (!normalizedName) {
      return res.status(400).json({
        success: false,
        message: "Category name must be between 2 and 50 characters",
      });
    }

    // Validate type.
    const normalizedType = normalizeCategoryType(type);

    if (!normalizedType) {
      return res.status(400).json({
        success: false,
        message: "Category type must be INCOME or EXPENSE",
      });
    }

    // Validate optional color.
    if (color !== undefined && !isValidColor(color)) {
      return res.status(400).json({
        success: false,
        message: "Color must be a valid hex color, such as #22C55E",
      });
    }

    // Validate optional icon.
    if (icon !== undefined && normalizeIcon(icon) === null) {
      return res.status(400).json({
        success: false,
        message: "Icon must be text with at most 50 characters",
      });
    }

    const nameKey = normalizedName.toLowerCase();

    // Check duplicate category.
    const existingCategory = await Category.findOne({
      userId: req.user.id,
      type: normalizedType,
      nameKey,
    });

    if (existingCategory) {
      return res.status(409).json({
        success: false,
        message: "A category with this name and type already exists",
      });
    }

    const category = await Category.create({
      userId: req.user.id,
      name: normalizedName,
      nameKey,
      type: normalizedType,
      ...(color !== undefined ? { color } : {}),
      ...(icon !== undefined ? { icon: normalizeIcon(icon) } : {}),
    });

    return res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: { category },
    });
  } catch (error) {
    console.error("Create category error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A category with this name and type already exists",
      });
    }

    if (
      error.name === "ValidationError" ||
      error.name === "CastError"
    ) {
      return res.status(400).json({
        success: false,
        message: "Category data is invalid",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to create category",
    });
  }
};

// --------------------------------------------------
// GET ALL CATEGORIES
// --------------------------------------------------

export const getCategories = async (req, res) => {
  try {
    const { type, archived } = req.query;

    const filter = {
      userId: req.user.id,
    };

    // Filter by category type.
    if (type !== undefined) {
      const normalizedType = normalizeCategoryType(type);

      if (!normalizedType) {
        return res.status(400).json({
          success: false,
          message: "Type must be INCOME or EXPENSE",
        });
      }

      filter.type = normalizedType;
    }

    // Return active categories by default.
    if (archived === undefined || archived === "false") {
      filter.isArchived = false;
    } else if (archived === "true") {
      filter.isArchived = true;
    } else {
      return res.status(400).json({
        success: false,
        message: "Archived must be true or false",
      });
    }

    const categories = await Category.find(filter)
      .sort({ type: 1, name: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      message: "Categories fetched successfully",
      data: {
        categories,
        total: categories.length,
      },
    });
  } catch (error) {
    console.error("Get categories error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch categories",
    });
  }
};

// --------------------------------------------------
// GET CATEGORY BY ID
// --------------------------------------------------

export const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID",
      });
    }

    const category = await Category.findOne({
      _id: id,
      userId: req.user.id,
    }).lean();

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Category fetched successfully",
      data: { category },
    });
  } catch (error) {
    console.error("Get category by ID error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch category",
    });
  }
};

// --------------------------------------------------
// UPDATE CATEGORY
// --------------------------------------------------

export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID",
      });
    }

    if (!isValidRequestBody(req.body)) {
      return res.status(400).json({
        success: false,
        message: "Request body must be a JSON object",
      });
    }

    const body = req.body;
    const suppliedFields = Object.keys(body);

    if (suppliedFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Provide at least one field to update",
      });
    }

    const unknownFields = getUnknownFields(
      body,
      ALLOWED_UPDATE_FIELDS
    );

    if (unknownFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: "One or more fields cannot be updated",
        fields: unknownFields,
      });
    }

    const category = await Category.findOne({
      _id: id,
      userId: req.user.id,
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    if (category.isArchived) {
      return res.status(400).json({
        success: false,
        message: "Archived categories cannot be updated",
      });
    }

    const updates = {};

    // Validate and update name.
    if (body.name !== undefined) {
      const normalizedName = normalizeCategoryName(body.name);

      if (!normalizedName) {
        return res.status(400).json({
          success: false,
          message: "Category name must be between 2 and 50 characters",
        });
      }

      const nameKey = normalizedName.toLowerCase();

      const duplicate = await Category.findOne({
        userId: req.user.id,
        type: category.type,
        nameKey,
        _id: { $ne: category._id },
      });

      if (duplicate) {
        return res.status(409).json({
          success: false,
          message: "A category with this name and type already exists",
        });
      }

      updates.name = normalizedName;
      updates.nameKey = nameKey;
    }

    // Validate color.
    if (body.color !== undefined) {
      if (!isValidColor(body.color)) {
        return res.status(400).json({
          success: false,
          message: "Color must be a valid hex color, such as #22C55E",
        });
      }

      updates.color = body.color;
    }

    // Validate icon.
    if (body.icon !== undefined) {
      const normalizedIcon = normalizeIcon(body.icon);

      if (normalizedIcon === null) {
        return res.status(400).json({
          success: false,
          message: "Icon must be text with at most 50 characters",
        });
      }

      updates.icon = normalizedIcon;
    }

    Object.assign(category, updates);

    await category.save();

    return res.status(200).json({
      success: true,
      message: "Category updated successfully",
      data: { category },
    });
  } catch (error) {
    console.error("Update category error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A category with this name and type already exists",
      });
    }

    if (
      error.name === "ValidationError" ||
      error.name === "CastError"
    ) {
      return res.status(400).json({
        success: false,
        message: "Category data is invalid",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to update category",
    });
  }
};

// --------------------------------------------------
// ARCHIVE CATEGORY
// --------------------------------------------------

export const archiveCategory = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID",
      });
    }

    // Find only a category owned by the authenticated user.
    const category = await Category.findOne({
      _id: id,
      userId: req.user.id,
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // Make repeated archive requests safe.
    if (category.isArchived) {
      return res.status(200).json({
        success: true,
        message: "Category is already archived",
        data: category,
      });
    }

    category.isArchived = true;

    await category.save();

    return res.status(200).json({
      success: true,
      message: "Category archived successfully",
      data: category,
    });
  } catch (error) {
    console.error("Archive category error:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Category data is invalid",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to archive category",
    });
  }
};
