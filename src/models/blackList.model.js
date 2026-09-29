import mongoose from "mongoose";

const tokenBlackListSchema = new mongoose.Schema(
  {
    token: {
      type: String,
      required: [true, "Token is required"],
      unique: [true, "token is already blacklisted"],
    },
  },
  { timestamps: true },
);

tokenBlackListSchema.index(
  { createdAt: 1 },
  {
    expireAfterSeconds: 60 * 60 * 24 * 3,
  },
);

const tokenBlackListModel = mongoose.model(
  "tokenBlackList",
  tokenBlackListSchema,
);

export default tokenBlackListModel;
