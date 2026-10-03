import mongoose from "mongoose";

const refreshTokenSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    tokenId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    tokenHash: {
      type: String,
      required: true,
      select: false,
    },

    expiresAt: {
      type: Date,
      required: true,
    },

    revokedAt: {
      type: Date,
      default: null,
    },

    replacedByTokenId: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

refreshTokenSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 }
);

const RefreshToken = mongoose.model(
  "RefreshToken",
  refreshTokenSchema
);

export default RefreshToken;