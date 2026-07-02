import {
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
} from '../lib/errors.js';
import generateTokens, { refreshCookieOptions } from "../utils/generateToken.js";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { encryptId } from "../utils/crypto.js";
import { createSignedUrlFromSupabaseUrl } from "../services/upload.service.js";
import {
  findUserByEmail,
  createUser,
  verifyPassword,
  updateRefreshToken,
  findUserById,
  createPasswordResetToken,
  resetPassword,
  verifyEmailToken
} from "../services/auth.service.js";
import { sendPasswordResetEmail, sendWelcomeEmail, sendVerificationEmail } from "../services/email.service.js";
import { getSetting } from "../config/settings.cache.js";

let privateKey;
if (process.env.RSA_PRIVATE_KEY) {
  privateKey = process.env.RSA_PRIVATE_KEY.replace(/\\n/g, '\n');
} else {
  console.warn('RSA_PRIVATE_KEY not set — password decryption will be disabled');
}

const decryptParam = (encrypted) => {
  const value = String(encrypted || "");
  const looksEncrypted = /^[A-Za-z0-9+/=\r\n]+$/.test(value) && value.length > 48;

  if (!looksEncrypted) {
    return value;
  }

  if (!privateKey) {
    throw new BadRequestError('RSA private key not configured on the server');
  }

  try {
    const decrypted = crypto.privateDecrypt(
      {
        key: privateKey,
        padding: crypto.constants.RSA_PKCS1_PADDING,
      },
      Buffer.from(value, 'base64')
    );
    return decrypted.toString('utf8');
  } catch {
    if (!looksEncrypted) {
      return value;
    }
    throw new BadRequestError('Invalid encrypted parameter');
  }
};

const isStrongPassword = (password) => {
  return typeof password === "string"
    && password.length >= 8
    && /[a-z]/.test(password)
    && /[A-Z]/.test(password)
    && /\d/.test(password);
};

const register = async (req, res, next) => {
  try {
    if (getSetting("maintenance_mode") === "true") {
      throw new ForbiddenError(getSetting("maintenance_reason") || "Registration is currently disabled due to system maintenance.");
    }

    const { name, email, password } = req.body;
    const decryptedPassword = decryptParam(password);

    if (!isStrongPassword(decryptedPassword)) {
      throw new BadRequestError("Password must be at least 8 characters and include uppercase, lowercase, and a number");
    }

    const userExists = await findUserByEmail(email);
    if (userExists) {
      return res.status(200).json({
        status: "success",
        message: "If your email is eligible for registration, you will receive a verification message shortly.",
      });
    }

    const { user, verificationToken } = await createUser({
      name,
      email,
      password: decryptedPassword,
      role: "job_seeker",
    });

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const verifyUrl = `${frontendUrl}/verify-email?token=${encodeURIComponent(verificationToken)}`;
    await sendVerificationEmail(user, verifyUrl);
    sendWelcomeEmail(user).catch(() => {});

    return res.status(201).json({
      status: "success",
      message: "User registered successfully. Please check your email to verify your account.",
      data: {
        user: {
          id: user.id,
          encryptedId: encryptId(user.id),
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const decryptedPassword = decryptParam(password);

    const user = await findUserByEmail(email);
    if (!user) {
      throw new BadRequestError("Invalid email or password");
    }

    if (user.role !== "super_admin" && getSetting("maintenance_mode") === "true") {
      throw new ForbiddenError(getSetting("maintenance_reason") || "System is currently undergoing maintenance. Please try again later.");
    }

    const isPasswordValid = await verifyPassword(decryptedPassword, user.password);
    if (!isPasswordValid) {
      throw new BadRequestError("Invalid email or password");
    }

    if (!user.isVerified) {
      throw new ForbiddenError("Please verify your email address to log in.");
    }

    if (user.isSuspended) {
      throw new ForbiddenError("Your account has been suspended by an administrator. Please contact support for more information.");
    }

    const { accessToken, refreshToken } = generateTokens(user.id, user.role, res);
    await updateRefreshToken(user.id, refreshToken);

    return res.status(200).json({
      status: "success",
      message: "User logged in successfully",
      data: {
        user: {
          id: user.id,
          encryptedId: encryptId(user.id),
          name: user.name,
          email: user.email,
          role: user.role,
        },
        token: accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    if (req.user && req.user.id) {
      await updateRefreshToken(req.user.id, null);
    }
    res.cookie("jwt", "", {
      ...refreshCookieOptions,
      expires: new Date(0),
      maxAge: 0,
    });
    return res.status(200).json({
      status: "success",
      message: "Logged out successfully",
    });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const resume = req.user.resume
      ? await createSignedUrlFromSupabaseUrl(req.user.resume, "resumes")
      : req.user.resume;

    return res.status(200).json({
      status: "success",
      data: {
        ...req.user,
        resume,
        encryptedId: encryptId(req.user.id)
      }
    });
  } catch (error) {
    next(error);
  }
};

const refresh = async (req, res, next) => {
  try {
    // CSRF protection: validate Origin header on cross-origin cookie-based requests.
    // SameSite=None cookies are sent cross-origin; this blocks attacker-controlled origins.
    const origin = req.headers.origin || req.headers.referer;
    if (origin) {
      const allowedOrigins = [
        process.env.FRONTEND_URL,
        "https://nexthire.devqii.me",
        "https://next-hire.devqii.me",
        "http://localhost:3000",
      ].filter(Boolean);
      const isValid = allowedOrigins.some((allowed) => origin.startsWith(allowed));
      if (!isValid) {
        throw new UnauthorizedError("Not authorized, invalid origin");
      }
    }

    const refreshToken = req.cookies.jwt;
    if (!refreshToken) {
      throw new UnauthorizedError("Not authorized, no refresh token");
    }

    if (!process.env.JWT_REFRESH_SECRET) {
      throw new UnauthorizedError("Server configuration error");
    }
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await findUserById(decoded.id);
    if (!user || user.refreshToken !== refreshToken) {
      throw new UnauthorizedError("Not authorized, invalid refresh token");
    }

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user.id, user.role, res);
    await updateRefreshToken(user.id, newRefreshToken);

    res.status(200).json({
      status: "success",
      data: {
        token: accessToken
      }
    });
  } catch (error) {
    next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await findUserByEmail(email);

    if (user) {
      const resetToken = await createPasswordResetToken(user.id);
      const resetBaseUrl = process.env.FRONTEND_RESET_PASSWORD_URL
        || `${process.env.FRONTEND_URL || "http://localhost:3000"}/reset-password`;
      const tokenSeparator = resetBaseUrl.includes("?") ? "&" : "?";
      const resetUrl = `${resetBaseUrl}${tokenSeparator}token=${encodeURIComponent(resetToken)}`;
      await sendPasswordResetEmail(user, resetUrl);
    }

    return res.status(200).json({
      status: "success",
      message: "If an account exists for that email, a password reset link has been sent.",
    });
  } catch (error) {
    next(error);
  }
};

const resetPasswordController = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    const decryptedPassword = decryptParam(password);

    if (!isStrongPassword(decryptedPassword)) {
      throw new BadRequestError("Password must be at least 8 characters and include uppercase, lowercase, and a number");
    }

    const didReset = await resetPassword(token, decryptedPassword);

    if (!didReset) {
      throw new BadRequestError("Password reset link is invalid or expired");
    }

    return res.status(200).json({
      status: "success",
      message: "Password reset successfully",
    });
  } catch (error) {
    next(error);
  }
};

const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.body;
    const verified = await verifyEmailToken(token);
    if (!verified) {
      throw new BadRequestError("Verification token is invalid or has expired.");
    }

    return res.status(200).json({
      status: "success",
      message: "Email verified successfully.",
    });
  } catch (error) {
    next(error);
  }
};

const docsHandoff = async (req, res, next) => {
  try {
    const raw = req.query.token;
    const token = typeof raw === "string" ? raw : Array.isArray(raw) ? raw[0] : "";
    if (!token) {
      return next(new UnauthorizedError("Not authorized, no token"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== "super_admin") {
      return next(new ForbiddenError("Only super admins can access API docs"));
    }

    const isProduction = process.env.NODE_ENV === "production";
    res.cookie("token", token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      maxAge: 5 * 60 * 1000,
      path: "/",
    });

    const base = (process.env.BACKEND_URL || process.env.API_URL || `${req.protocol}://${req.get("host")}`)
      .replace(/\/$/, "");
    return res.redirect(302, `${base}/docs`);
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return next(new UnauthorizedError("Not authorized, token expired"));
    }
    return next(new UnauthorizedError("Not authorized, invalid token"));
  }
};

export {
  register,
  login,
  logout,
  getMe,
  refresh,
  forgotPassword,
  resetPasswordController,
  verifyEmail,
  docsHandoff,
};
