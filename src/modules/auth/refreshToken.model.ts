import { Schema, model } from "mongoose";

const refreshTokenSchema = new Schema(
  {
    adminId: { type: Schema.Types.ObjectId, ref: "Admin", required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    replacedByTokenHash: { type: String },
    revokedAt: { type: Date },
    expiresAt: { type: Date, required: true },

    createdByIp: { type: String },
    revokedByIp: { type: String },
  },
  { timestamps: true }
);

export const RefreshToken = model("RefreshToken", refreshTokenSchema);
