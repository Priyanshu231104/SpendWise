import mongoose from "mongoose";
import Category from "../models/Category.js";

const CATEGORY_TYPES = ["INCOME", "EXPENSE"];

export const createCategory = async (req, res) => {
  try {
    const { name, type, color, icon } = req.body;

    // Validate category name.
    if (
      typeof name !== "string" ||
      name.trim().length < 2 ||
      name.trim().length > 50
    ) {
      return res.status(400).json({
        success: false,
        message: "Category name must be between 2 and 50 characters",
      });
    }

    // Validate and normalize category type.
    if (
      typeof type !== "string" ||
      !CATEGORY_TYPES.includes(type.trim().toUpperCase())
    ) {
      return res.status(400).json({
        success: false,
        message: "Category type must be INCOME or EXPENSE",
      });
    }

    const normalizedName = name.trim();
    const normalizedType = type.trim().toUpperCase();
    const nameKey = normalizedName.toLowerCase();

    // Validate optional color.
    if (
      color !== undefined &&
      (
        typeof color !== "string" ||
        !/^#[0-9A-Fa-f]{6}$/.test(color)
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Color must be a valid hex color, such as #22C55E",
      });
    }

    // Validate optional icon.
    if (
      icon !== undefined &&
      (
        typeof icon !== "string" ||
        icon.trim().length > 50
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Icon must be text with at most 50 characters",
      });
    }

    // Check for duplicate names belonging to this user and type.
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
      ...(icon !== undefined ? { icon: icon.trim() } : {}),
    });

    return res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: { category },
    });
  } catch (error) {
    console.error("Create category error:", error.message);

    // Handle duplicate-key conflicts, including concurrent requests.
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


export const getCategories = async (req, res) => {
  try {
    const { type, archived } = req.query;

    const filter = {
      userId: req.user.id,
    };

    // Optional filtering by category type.
    if (type !== undefined) {
      if (
        typeof type !== "string" ||
        !CATEGORY_TYPES.includes(type.trim().toUpperCase())
      ) {
        return res.status(400).json({
          success: false,
          message: "Type must be INCOME or EXPENSE",
        });
      }

      filter.type = type.trim().toUpperCase();
    }

    // By default, return only active categories.
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
    console.error("Get categories error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch categories",
    });
  }
};


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
    console.error("Get category by ID error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch category",
    });
  }
};


export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID",
      });
    }

    const allowedFields = ["name", "color", "icon"];
    const body = req.body;

    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body)
    ) {
      return res.status(400).json({
        success: false,
        message: "Request body must be a JSON object",
      });
    }

    const suppliedFields = Object.keys(body);

    if (suppliedFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Provide at least one field to update",
      });
    }

    const unknownFields = suppliedFields.filter(
      (field) => !allowedFields.includes(field)
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

    if (body.name !== undefined) {
      if (
        typeof body.name !== "string" ||
        body.name.trim().length < 2 ||
        body.name.trim().length > 50
      ) {
        return res.status(400).json({
          success: false,
          message: "Category name must be between 2 and 50 characters",
        });
      }

      const normalizedName = body.name.trim();
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

    if (body.color !== undefined) {
      if (
        typeof body.color !== "string" ||
        !/^#[0-9A-Fa-f]{6}$/.test(body.color)
      ) {
        return res.status(400).json({
          success: false,
          message: "Color must be a valid hex color, such as #22C55E",
        });
      }

      updates.color = body.color;
    }

    if (body.icon !== undefined) {
      if (
        typeof body.icon !== "string" ||
        body.icon.trim().length > 50
      ) {
        return res.status(400).json({
          success: false,
          message: "Icon must be text with at most 50 characters",
        });
      }

      updates.icon = body.icon.trim();
    }

    Object.assign(category, updates);
    await category.save();

    return res.status(200).json({
      success: true,
      message: "Category updated successfully",
      data: { category },
    });
  } catch (error) {
    console.error("Update category error:", error.message);

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


export const archiveCategory = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate the category ID
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID",
      });
    }

    // Find only a category owned by the authenticated user
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

    // Make repeated archive requests safe
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

    return res.status(500).json({
      success: false,
      message: "Failed to archive category",
    });
  }
};
