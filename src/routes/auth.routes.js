import express from "express";
import { z } from "zod";
import {
  register,
  login,
  logout,
  getMe,
  refresh,
  forgotPassword,
  resetPasswordController,
  verifyEmail,
  login2FA,
  generate2FA,
  verify2FA,
  disable2FA,
} from "../controllers/auth.controller.js";
import protect from "../middlewares/protect.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import { rateLimit } from "express-rate-limit";

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    status: "fail",
    message: "Too many login attempts, please try again after 15 minutes",
  },
});

const passwordResetRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: "fail",
    message: "Too many password reset requests, please try again after 1 hour",
  },
});

const router = express.Router();

// Validation schemas for registration and login
const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
});

// Validation schema for login
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  token: z.string().min(32),
  password: z.string().min(6),
});

const verifyEmailSchema = z.object({
  token: z.string().min(1),
});

router.post("/register", authRateLimiter, validate(registerSchema), register);
router.post("/login", authRateLimiter, validate(loginSchema), login);
router.post("/login/2fa", authRateLimiter, login2FA);
router.post("/forgot-password", passwordResetRateLimiter, validate(forgotPasswordSchema), forgotPassword);
router.post("/reset-password", authRateLimiter, validate(resetPasswordSchema), resetPasswordController);
router.post("/verify-email", validate(verifyEmailSchema), verifyEmail);
router.get("/me", protect, getMe);
router.post("/refresh", refresh);
router.post("/logout", protect, logout);

router.post("/2fa/generate", protect, generate2FA);
router.post("/2fa/verify", protect, verify2FA);
router.post("/2fa/disable", protect, disable2FA);

export default router;
