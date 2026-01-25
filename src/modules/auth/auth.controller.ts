import bcrypt from "bcrypt";
import { Types } from "mongoose";
import { sha256 } from "../../utils/util";
import { getIP } from "../../utils/getIp";
import { createAdmin, getAdmin } from "../admin/admin.services";
import { createOTP, verifyOTP } from "../otp/otp.sevice";
import { sendError, sendSuccess } from "../../utils/responses";
import { sendOTPEmail } from "../notification/notification.service";
import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import {
  createRefreshToken,
  findRefreshToken,
  revokeAllToken,
} from "./refreshToken.services";


export const signup = async (
  request: FastifyRequest,
  reply: FastifyReply,
  app: FastifyInstance,
) => {
  const { email, password, name } = request.body as any;

  await createAdmin({email, password, name})

  return sendSuccess(reply, { message:"Admin created successfully" });
};



export const login = async (
  request: FastifyRequest,
  reply: FastifyReply,
  app: FastifyInstance,
) => {
  const { email, password } = request.body as any;

  const admin = await getAdmin({ email });

  if (!admin || !admin.isActive) {
    return sendError(reply, { message: "No admin asociated with the email" });
  }

  const ok = await bcrypt.compare(password, admin.password);
  if (!ok) return reply.code(401).send({ message: "Invalid credentials" });

  admin.lastLoginAt = new Date();
  await admin.save();

  const accessToken = (app.jwt as any).access.sign({
    sub: admin._id.toString(),
    role: admin.role,
  });
  
  const refreshToken = (app.jwt as any).refresh.sign({
    sub: admin._id.toString(),
  });
  console.log(refreshToken)
  const refreshHash = sha256(refreshToken);
  await createRefreshToken(
    admin._id,
    refreshHash,
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    getIP(request),
  );

  return sendSuccess(reply, { data: { accessToken, refreshToken } });
};

export const renewToken = async (
  request: FastifyRequest,
  reply: FastifyReply,
  app: FastifyInstance,
) => {
  const { refreshToken } = request.body as any;

  let payload: any;
  try {
    payload = await (app.jwt as any).refresh.verify(refreshToken);
    console.log()
  } catch {
    return sendError(reply, {
      statusCode: 401,
      message: "Invalid refresh token",
    });
  }

  const refreshHash = sha256(refreshToken);

  const stored = await findRefreshToken(refreshHash);
  if (!stored)
    return sendError(reply, {
      statusCode: 401,
      message: "Refresh token not found",
    });

  if (stored.revokedAt)
    return sendError(reply, {
      statusCode: 401,
      message: "Refresh token revoked",
    });
  if (stored.expiresAt.getTime() < Date.now()) {
    return sendError(reply, {
      statusCode: 401,
      message: "Refresh token expired",
    });
  }

  const adminId = payload.sub as Types.ObjectId;

  const newAccessToken = (app.jwt as any).access.sign({ sub: adminId, role: "owner" });

  const newRefreshToken = (app.jwt as any).refresh.sign({ sub: adminId });
  const newRefreshHash = sha256(newRefreshToken);

  stored.revokedAt = new Date();
  stored.revokedByIp = getIP(request);
  stored.replacedByTokenHash = newRefreshHash;
  await stored.save();
  await createRefreshToken(
    adminId,
    newRefreshHash,
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    getIP(request),
  );

  return sendSuccess(reply, {
    data: { accessToken: newAccessToken, refreshToken: newRefreshToken },
  });
};

export const logout = async (request: FastifyRequest, reply: FastifyReply) => {
  const { refreshToken } = request.body as any;
  const refreshHash = sha256(refreshToken);

  const stored = await findRefreshToken(refreshHash);

  if (stored && !stored.revokedAt) {
    stored.revokedAt = new Date();
    stored.revokedByIp = getIP(request);
    await stored.save();
  }
  return sendSuccess(reply, { message: "successfully logged out" });
};

export const requestPasswordReset = async (
  request: FastifyRequest,
  reply: FastifyReply,
  app: FastifyInstance,
) => {
  const { email } = request.body as any;

  const admin = await getAdmin({ email });
  if (!admin || !admin.isActive)
    return sendError(reply, { message: "No admin found", statusCode: 404 });

  const expiresInMinutes = 10;
  const otp = await createOTP(admin._id, "PASSWORD_RESET", 6, expiresInMinutes);

  await sendOTPEmail(app, admin.email, otp, "PASSWORD_RESET", expiresInMinutes);

  return sendSuccess(reply, { message: "Verification email sent!" });
};

export const verifyPasswordResetOtp = async (
  request: FastifyRequest,
  reply: FastifyReply,
  app: FastifyInstance,
) => {
  const { email, otp } = request.body as any;

  const admin = await getAdmin({ email });
  if (!admin || !admin.isActive) {
    return sendError(reply, { statusCode: 401, message: "Invalid OTP" });
  }

  try {
    await verifyOTP(admin._id, otp, "PASSWORD_RESET");
  } catch {
    return reply.code(400).send({ message: "Invalid OTP" });
  }

  const resetToken = (app.jwt as any).reset.sign({
    sub: admin._id.toString(),
    typ: "password_reset",
  });

  return sendSuccess(reply, { data: resetToken });
};

export const resetPassword = async (
  request: FastifyRequest,
  reply: FastifyReply,
  app: FastifyInstance,
) => {
  const { resetToken, newPassword } = request.body as any;

  let payload: any;
  try {
    payload = (app.jwt as any).reset.verify(resetToken);
  } catch {
    return sendError(reply, {
      statusCode: 401,
      message: "Invalid or expired reset token",
    });
  }

  if (payload?.typ !== "password_reset") {
    return sendError(reply, {
      statusCode: 401, message: "Invalid reset token" });
  }

  const adminId = payload.sub;

  const admin = await getAdmin({ id: adminId });
  if (!admin || !admin.isActive) {
    return sendError(reply, {
      statusCode: 400,message: "Invalid reset token" });
  }

  admin.password = await bcrypt.hash(newPassword, 12);
  await admin.save();
  await revokeAllToken(admin._id, getIP(request));

  return sendSuccess(reply, {message: "Success"})
};
