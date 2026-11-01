
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

import User from "../models/User.js";
import RefreshToken from "../models/RefreshToken.js";

const REFRESH_COOKIE_NAME = "spendwise_refresh";

const refreshCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  path: "/api/v1/auth",
};

const clearRefreshCookie = (res) => {
  res.clearCookie(REFRESH_COOKIE_NAME, refreshCookieOptions);
};

const isValidRequestBody = (body) => {
  return (
    body !== null &&
    typeof body === "object" &&
    !Array.isArray(body)
  );
};

const isValidPassword = (password) => {
  return (
    typeof password === "string" &&
    password.length >= 8 &&
    Buffer.byteLength(password, "utf8") <= 72
  );
};

const getSafeUserData = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  currency: user.currency,
  isActive: user.isActive,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

// --------------------------------------------------
// GET CURRENT USER
// --------------------------------------------------

export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      "-passwordHash"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Profile fetched successfully",
      data: {
        user: getSafeUserData(user),
      },
    });
  } catch (error) {
    console.error("Get profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch profile",
    });
  }
};

// --------------------------------------------------
// UPDATE CURRENT USER
// --------------------------------------------------

export const updateCurrentUser = async (req, res) => {
  try {
    if (!isValidRequestBody(req.body)) {
      return res.status(400).json({
        success: false,
        message: "Invalid request body",
      });
    }

    const { name, currency } = req.body;

    const updates = {};

    // Validate name
    if (name !== undefined) {
      if (typeof name !== "string") {
        return res.status(400).json({
          success: false,
          message: "Name must be text",
        });
      }

      const trimmedName = name.trim();

      if (trimmedName.length < 2 || trimmedName.length > 100) {
        return res.status(400).json({
          success: false,
          message: "Name must be between 2 and 100 characters",
        });
      }

      updates.name = trimmedName;
    }

    // Validate currency
    if (currency !== undefined) {
      if (typeof currency !== "string") {
        return res.status(400).json({
          success: false,
          message: "Currency must be text",
        });
      }

      const normalizedCurrency = currency.trim().toUpperCase();

      if (!/^[A-Z]{3}$/.test(normalizedCurrency)) {
        return res.status(400).json({
          success: false,
          message: "Currency must be a 3-letter currency code",
        });
      }

      updates.currency = normalizedCurrency;
    }

    // Prevent empty or unsupported updates
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid profile fields provided",
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updates },
      {
        new: true,
        runValidators: true,
      }
    ).select("-passwordHash");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: {
        user: getSafeUserData(user),
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);

    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid profile details",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to update profile",
    });
  }
};

// --------------------------------------------------
// CHANGE PASSWORD
// --------------------------------------------------

export const changePassword = async (req, res) => {
  let session;

  try {
    if (!isValidRequestBody(req.body)) {
      return res.status(400).json({
        success: false,
        message: "Invalid request body",
      });
    }

    const { currentPassword, newPassword } = req.body;

    if (
      typeof currentPassword !== "string" ||
      typeof newPassword !== "string" ||
      !currentPassword ||
      !newPassword
    ) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required",
      });
    }

    if (!isValidPassword(newPassword)) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 8 characters and no more than 72 bytes",
      });
    }

    if (Buffer.byteLength(currentPassword, "utf8") > 72) {
      return res.status(400).json({
        success: false,
        message: "Invalid current password",
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message: "New password must be different from current password",
      });
    }

    const user = await User.findById(req.user.id).select(
      "+passwordHash"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.passwordHash
    );

    if (!isCurrentPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 12);

    // Update password and revoke refresh sessions atomically.
    session = await mongoose.startSession();

    await session.withTransaction(async () => {
      const updatedUser = await User.findById(req.user.id).session(
        session
      );

      if (!updatedUser) {
        throw new Error("USER_NOT_FOUND");
      }

      updatedUser.passwordHash = newPasswordHash;

      await updatedUser.save({ session });

      await RefreshToken.updateMany(
        {
          user: updatedUser._id,
          revokedAt: null,
        },
        {
          $set: {
            revokedAt: new Date(),
          },
        },
        { session }
      );
    });

    // Clear the current browser's refresh cookie.
    clearRefreshCookie(res);

    return res.status(200).json({
      success: true,
      message: "Password changed successfully. Please log in again.",
    });
  } catch (error) {
    console.error("Change password error:", error);

    if (error.message === "USER_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Invalid password details",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to change password",
    });
  } finally {
    if (session) {
      await session.endSession();
    }
  }
};
