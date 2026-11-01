import jwt from "jsonwebtoken";

const JWT_ALGORITHM = "HS256";

const getSecret = (name) => {
  const secret = process.env[name];

  if (
    typeof secret !== "string" ||
    secret.length < 32 ||
    secret !== secret.trim()
  ) {
    throw new Error(
      `${name} must be configured as a strong secret`
    );
  }

  return secret;
};

export const generateAccessToken = (user) => {
  return jwt.sign(
    {
      sub: user._id.toString(),
      role: user.role,
    },
    getSecret("ACCESS_TOKEN_SECRET"),
    {
      algorithm: JWT_ALGORITHM,
      expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || "15m",
    }
  );
};

export const generateRefreshToken = (user, tokenId) => {
  return jwt.sign(
    {
      sub: user._id.toString(),
      tokenId,
    },
    getSecret("REFRESH_TOKEN_SECRET"),
    {
      algorithm: JWT_ALGORITHM,
      expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || "7d",
    }
  );
};