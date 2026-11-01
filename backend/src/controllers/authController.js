
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { timingSafeEqual } from "node:crypto";

import User from "../models/User.js";
import RefreshToken from "../models/RefreshToken.js";

import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/token.js";

import {
  hashToken,
  generateTokenId,
} from "../utils/crypto.js";

const REFRESH_COOKIE_NAME = "spendwise_refresh";

const REFRESH_TOKEN_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

const refreshCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  path: "/api/v1/auth",
  maxAge: REFRESH_TOKEN_DURATION_MS,
};

const clearRefreshCookie = (res) => {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: refreshCookieOptions.secure,
    sameSite: refreshCookieOptions.sameSite,
    path: refreshCookieOptions.path,
  });
};

// Validate request body
const isValidRequestBody = (body) => {
  return (
    body !== null &&
    typeof body === "object" &&
    !Array.isArray(body)
  );
};

// Validate email format
const isValidEmail = (email) => {
  if (typeof email !== "string") return false;

  const normalizedEmail = email.trim();

  if (normalizedEmail.length > 254) return false;

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);
};

// Compare hashes without ordinary string comparison
const safeHashCompare = (providedHash, storedHash) => {
  if (
    typeof providedHash !== "string" ||
    typeof storedHash !== "string"
  ) {
    return false;
  }

  const providedBuffer = Buffer.from(providedHash, "hex");
  const storedBuffer = Buffer.from(storedHash, "hex");

  if (
    providedBuffer.length !== storedBuffer.length ||
    providedBuffer.length === 0
  ) {
    return false;
  }

  return timingSafeEqual(providedBuffer, storedBuffer);
};

// Validate refresh-token payload
const isValidRefreshPayload = (decoded) => {
  return (
    decoded !== null &&
    typeof decoded === "object" &&
    typeof decoded.sub === "string" &&
    mongoose.isValidObjectId(decoded.sub) &&
    typeof decoded.tokenId === "string" &&
    decoded.tokenId.length > 0 &&
    Number.isInteger(decoded.exp) &&
    decoded.exp > 0
  );
};

// --------------------------------------------------
// REGISTER
// --------------------------------------------------

export const registerUser = async (req, res) => {
  try {
    if (!isValidRequestBody(req.body)) {
      return res.status(400).json({
        success: false,
        message: "Invalid request body",
      });
    }

    const { name, email, password } = req.body;

    // Validate field types
    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password must be valid text",
      });
    }

    const normalizedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    // Validate required fields
    if (!normalizedName || !normalizedEmail || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required",
      });
    }

    // Validate name
    if (normalizedName.length < 2 || normalizedName.length > 80) {
      return res.status(400).json({
        success: false,
        message: "Name must be between 2 and 80 characters",
      });
    }

    // Validate email
    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address",
      });
    }

    // bcrypt supports passwords up to 72 bytes
    const passwordBytes = Buffer.byteLength(password, "utf8");

    if (password.length < 8 || passwordBytes > 72) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters and no more than 72 bytes",
      });
    }

    // Check whether the email already exists
    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const user = await User.create({
      name: normalizedName,
      email: normalizedEmail,
      passwordHash,
    });

    return res.status(201).json({
      success: true,
      message: "Account created successfully",
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          currency: user.currency,
        },
      },
    });
  } catch (error) {
    // Handle duplicate email race condition
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    // Handle model validation errors
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Invalid registration details",
      });
    }

    console.error("Registration error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create account",
    });
  }
};

// --------------------------------------------------
// LOGIN
// --------------------------------------------------

export const loginUser = async (req, res) => {
  try {
    if (!isValidRequestBody(req.body)) {
      return res.status(400).json({
        success: false,
        message: "Invalid request body",
      });
    }

    const { email, password } = req.body;

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address",
      });
    }

    // Find user and explicitly include passwordHash
    const user = await User.findOne({
      email: normalizedEmail,
    }).select("+passwordHash");

    // Do not reveal whether the email exists
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      user.passwordHash
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Reject inactive accounts
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account is currently unavailable",
      });
    }

    // Generate refresh-token session
    const tokenId = generateTokenId();

    const accessToken = generateAccessToken(user);

    const refreshToken = generateRefreshToken(
      user,
      tokenId
    );

    const refreshTokenExpiresAt = new Date(
      Date.now() + REFRESH_TOKEN_DURATION_MS
    );

    // Store only the refresh-token hash
    await RefreshToken.create({
      user: user._id,
      tokenId,
      tokenHash: hashToken(refreshToken),
      expiresAt: refreshTokenExpiresAt,
    });

    // Set HttpOnly refresh cookie
    res.cookie(
      REFRESH_COOKIE_NAME,
      refreshToken,
      refreshCookieOptions
    );

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        accessToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          currency: user.currency,
        },
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to login",
    });
  }
};

// --------------------------------------------------
// REFRESH ACCESS TOKEN
// --------------------------------------------------

export const refreshAccessToken = async (req, res) => {
  let session;

  try {
    const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Refresh token is required",
      });
    }

    const refreshSecret = process.env.REFRESH_TOKEN_SECRET;

    if (!refreshSecret) {
      console.error("REFRESH_TOKEN_SECRET is not configured");

      return res.status(500).json({
        success: false,
        message: "Authentication service unavailable",
      });
    }

    let decoded;

    try {
      decoded = jwt.verify(refreshToken, refreshSecret, {
        algorithms: ["HS256"],
      });
    } catch {
      clearRefreshCookie(res);

      return res.status(401).json({
        success: false,
        message: "Invalid or expired refresh token",
      });
    }

    if (!isValidRefreshPayload(decoded)) {
      clearRefreshCookie(res);

      return res.status(401).json({
        success: false,
        message: "Invalid refresh token payload",
      });
    }

    // Start session inside try so failures are handled
    session = await RefreshToken.startSession();

    let newAccessToken;
    let newRefreshToken;

    await session.withTransaction(async () => {
      const storedToken = await RefreshToken.findOne({
        tokenId: decoded.tokenId,
        user: decoded.sub,
        revokedAt: null,
        expiresAt: { $gt: new Date() },
      })
        .select("+tokenHash")
        .session(session);

      if (!storedToken) {
        throw new Error("INVALID_REFRESH_TOKEN");
      }

      const providedTokenHash = hashToken(refreshToken);

      if (
        !safeHashCompare(
          providedTokenHash,
          storedToken.tokenHash
        )
      ) {
        throw new Error("INVALID_REFRESH_TOKEN");
      }

      const user = await User.findById(storedToken.user)
        .session(session);

      if (!user || !user.isActive) {
        throw new Error("USER_UNAVAILABLE");
      }

      const newTokenId = generateTokenId();

      newAccessToken = generateAccessToken(user);

      newRefreshToken = generateRefreshToken(
        user,
        newTokenId
      );

      const newDecoded = jwt.decode(newRefreshToken);

      if (
        !newDecoded ||
        typeof newDecoded !== "object" ||
        !Number.isInteger(newDecoded.exp)
      ) {
        throw new Error("INVALID_NEW_TOKEN_EXPIRY");
      }

      // Atomically claim old token for rotation
      const claimedToken = await RefreshToken.findOneAndUpdate(
        {
          _id: storedToken._id,
          revokedAt: null,
          expiresAt: { $gt: new Date() },
          tokenHash: providedTokenHash,
        },
        {
          $set: {
            revokedAt: new Date(),
            replacedByTokenId: newTokenId,
          },
        },
        {
          new: true,
          session,
        }
      );

      if (!claimedToken) {
        throw new Error("INVALID_REFRESH_TOKEN");
      }

      // Save replacement refresh token
      await RefreshToken.create(
        [
          {
            user: user._id,
            tokenId: newTokenId,
            tokenHash: hashToken(newRefreshToken),
            expiresAt: new Date(newDecoded.exp * 1000),
          },
        ],
        { session }
      );
    });

    res.cookie(
      REFRESH_COOKIE_NAME,
      newRefreshToken,
      refreshCookieOptions
    );

    return res.status(200).json({
      success: true,
      message: "Access token refreshed successfully",
      data: {
        accessToken: newAccessToken,
      },
    });
  } catch (error) {
    if (
      error.message === "INVALID_REFRESH_TOKEN" ||
      error.message === "USER_UNAVAILABLE"
    ) {
      clearRefreshCookie(res);

      return res.status(401).json({
        success: false,
        message:
          error.message === "USER_UNAVAILABLE"
            ? "User account is unavailable"
            : "Invalid or expired refresh token",
      });
    }

    console.error("Refresh token error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to refresh access token",
    });
  } finally {
    if (session) {
      await session.endSession();
    }
  }
};

// --------------------------------------------------
// LOGOUT
// --------------------------------------------------

export const logoutUser = async (req, res) => {
  try {
    const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];

    // Always clear browser cookie
    if (!refreshToken) {
      clearRefreshCookie(res);

      return res.status(200).json({
        success: true,
        message: "Logout successful",
      });
    }

    const refreshSecret = process.env.REFRESH_TOKEN_SECRET;

    if (!refreshSecret) {
      console.error("REFRESH_TOKEN_SECRET is not configured");

      clearRefreshCookie(res);

      return res.status(500).json({
        success: false,
        message: "Authentication service unavailable",
      });
    }

    let decoded;

    try {
      decoded = jwt.verify(refreshToken, refreshSecret, {
        algorithms: ["HS256"],
      });
    } catch {
      clearRefreshCookie(res);

      return res.status(200).json({
        success: true,
        message: "Logout successful",
      });
    }

    if (!isValidRefreshPayload(decoded)) {
      clearRefreshCookie(res);

      return res.status(200).json({
        success: true,
        message: "Logout successful",
      });
    }

    const storedToken = await RefreshToken.findOne({
      tokenId: decoded.tokenId,
      user: decoded.sub,
    }).select("+tokenHash");

    if (!storedToken) {
      clearRefreshCookie(res);

      return res.status(200).json({
        success: true,
        message: "Logout successful",
      });
    }

    const providedTokenHash = hashToken(refreshToken);

    if (
      !safeHashCompare(
        providedTokenHash,
        storedToken.tokenHash
      )
    ) {
      clearRefreshCookie(res);

      return res.status(200).json({
        success: true,
        message: "Logout successful",
      });
    }

    // Revoke refresh token if not already revoked
    if (!storedToken.revokedAt) {
      storedToken.revokedAt = new Date();
      await storedToken.save();
    }

    clearRefreshCookie(res);

    return res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    console.error("Logout error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to logout",
    });
  }
};
