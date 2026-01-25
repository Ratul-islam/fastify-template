import { FastifyInstance } from "fastify";
import {
  login,
  logout,
  renewToken,
  requestPasswordReset,
  resetPassword,
  signup,
  verifyPasswordResetOtp,
} from "./auth.controller";

export default async function authRoutes(app: FastifyInstance) {

  app.post(
    "/signup",
    {
      schema: {
        body: {
          type: "object",
          required: ["name","email", "password"],
          properties: {
            email: { type: "string", format: "email" },
            password: { type: "string", minLength: 6 },
            name: {type: "string"}
          },
        },
      },
    },
    async (request, reply) => {
      await signup(request, reply, app);
    },
  );


  app.post(
    "/login",
    {
      schema: {
        body: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string", format: "email" },
            password: { type: "string", minLength: 6 },
          },
        },
      },
    },
    async (request, reply) => {
      await login(request, reply, app);
    },
  );

  app.post(
    "/refresh",
    {
      schema: {
        body: {
          type: "object",
          required: ["refreshToken"],
          properties: {
            refreshToken: { type: "string", minLength: 10 },
          },
        },
      },
    },
    async (request, reply) => {
      await renewToken(request, reply, app);
    },
  );

  app.post(
    "/password-reset/request",
    {
      schema: {
        body: {
          type: "object",
          required: ["email"],
          properties: {
            email: { type: "string", format: "email" },
          },
        },
      },
    },
    async (request, reply) => {
      await requestPasswordReset(request, reply, app);
    },
  );
  
  app.post(
    "/password-reset/verify-otp",
    {
      schema: {
        body: {
          type: "object",
          required: ["email", "otp"],
          properties: {
            email: { type: "string", format: "email" },
            otp: { type: "string", minLength: 6, maxLength: 6 },
          },
        },
      },
    },
    async (request, reply) => {
      await verifyPasswordResetOtp(request, reply, app);
    },
  );

  app.post(
    "/password-reset/confirm",
    {
      schema: {
        body: {
          type: "object",
          required: ["resetToken", "newPassword"],
          properties: {
            resetToken: { type: "string", },
            newPassword: { type: "string", minLength: 6 },
          },
        },
      },
    },
    async (request, reply) => {
      await resetPassword(request, reply, app);
    },
  );

  app.post(
    "/logout",
    {
      schema: {
        body: {
          type: "object",
          required: ["refreshToken"],
          properties: { refreshToken: { type: "string" } },
        },
      },
    },
    async (request, reply) => {
      await logout(request, reply);
    },
  );
}
