import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/token.js";
import {
  hashToken,
  generateTokenId,
} from "../utils/crypto.js";
import RefreshToken from "../models/RefreshToken.js";

export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // 1. Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required",
      });
    }

    // 2. Check password length
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long",
      });
    }

    // 3. Check whether the email already exists
    const existingUser = await User.findOne({
      email: email.toLowerCase(),
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    // 4. Hash the password
    const passwordHash = await bcrypt.hash(password, 12);

    // 5. Create the user
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
    });

    // 6. Send a safe response
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
    console.error("Registration error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to create account",
    });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // 2. Find the user and explicitly include passwordHash
    const user = await User.findOne({
      email: email.toLowerCase(),
    }).select("+passwordHash");

    // 3. Don't reveal whether the email exists
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // 4. Compare the supplied password with the stored hash
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

    // 5. Generate token ID for the refresh-token session
    const tokenId = generateTokenId();
    
    // 6. Generate access and refresh tokens
    const accessToken = generateAccessToken(user);
    
    const refreshToken = generateRefreshToken(
      user,
      tokenId
    );
    
    // 7. Calculate refresh-token expiration
    const refreshTokenExpiresAt = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000
    );
    
    // 8. Store only the refresh-token hash
    await RefreshToken.create({
      user: user._id,
      tokenId,
      tokenHash: hashToken(refreshToken),
      expiresAt: refreshTokenExpiresAt,
    });
    
    // 9. Return tokens and safe user information
    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        accessToken,
        refreshToken,
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
    console.error("Login error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to login",
    });
  }
};

export const refreshAccessToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Refresh token is required",
      });
    }

    // Verify the refresh token's signature and expiration
    let decoded;

    try {
      decoded = jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET
      );
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired refresh token",
      });
    }

    // Find the refresh token record in MongoDB
    const storedToken = await RefreshToken.findOne({
      tokenId: decoded.tokenId,
    }).select("+tokenHash");

    if (!storedToken) {
      return res.status(401).json({
        success: false,
        message: "Refresh token not found",
      });
    }

    // Prevent reuse of revoked refresh tokens
    if (storedToken.revokedAt) {
      return res.status(401).json({
        success: false,
        message: "Refresh token has been revoked",
      });
    }

    // Check expiration stored in MongoDB
    if (storedToken.expiresAt <= new Date()) {
      return res.status(401).json({
        success: false,
        message: "Refresh token has expired",
      });
    }

    // Compare the provided token with the hashed token in DB
    const providedTokenHash = hashToken(refreshToken);

    if (providedTokenHash !== storedToken.tokenHash) {
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token",
      });
    }

    // Find the associated user
    const user = await User.findById(storedToken.user);

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: "User account is unavailable",
      });
    }

    // Create a new token ID
    const newTokenId = generateTokenId();

    // Generate new access token
    const newAccessToken = generateAccessToken(user);

    // Generate new refresh token
    const newRefreshToken = generateRefreshToken(
      user,
      newTokenId
    );

    const newRefreshTokenExpiresAt = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000
    );

    // Revoke the old refresh token
    storedToken.revokedAt = new Date();
    storedToken.replacedByTokenId = newTokenId;

    await storedToken.save();

    // Store the new refresh token
    await RefreshToken.create({
      user: user._id,
      tokenId: newTokenId,
      tokenHash: hashToken(newRefreshToken),
      expiresAt: newRefreshTokenExpiresAt,
    });

    return res.status(200).json({
      success: true,
      message: "Access token refreshed successfully",
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error) {
    console.error("Refresh token error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to refresh access token",
    });
  }
};

export const logoutUser = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: "Refresh token is required",
      });
    }

    let decoded;

    try {
      decoded = jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET
      );
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired refresh token",
      });
    }

    const storedToken = await RefreshToken.findOne({
      tokenId: decoded.tokenId,
    }).select("+tokenHash");

    if (!storedToken) {
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token",
      });
    }

    const providedTokenHash = hashToken(refreshToken);

    if (providedTokenHash !== storedToken.tokenHash) {
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token",
      });
    }

    if (storedToken.revokedAt) {
      return res.status(401).json({
        success: false,
        message: "Refresh token has already been revoked",
      });
    }

    storedToken.revokedAt = new Date();

    await storedToken.save();

    return res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    console.error("Logout error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to logout",
    });
  }
};