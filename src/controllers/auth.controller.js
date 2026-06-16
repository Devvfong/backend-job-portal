import generateTokens from "../utils/generateToken.js";
import crypto from "crypto";
import fs from "fs";
import path from "path";
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

// Load Private Key for RSA Decryption
let privateKey;
try {
  // Prefer environment variable (for Render/production), fallback to local file
  if (process.env.RSA_PRIVATE_KEY) {
    // In case the env var represents newlines as literal '\n'
    privateKey = process.env.RSA_PRIVATE_KEY.replace(/\\n/g, '\n');
  } else {
    const privateKeyPath = path.join(process.cwd(), "private_key.pem");
    privateKey = fs.readFileSync(privateKeyPath, "utf8");
  }
} catch (error) {
  console.warn("Warning: Could not load RSA Private Key. RSA decryption will fail.", error.message);
}

const decryptParam = (encrypted) => {
  const value = String(encrypted || "");
  const looksEncrypted = /^[A-Za-z0-9+/=\r\n]+$/.test(value) && value.length > 48;

  if (!looksEncrypted) {
    return value;
  }

  if (!privateKey) {
    const msg = 'RSA private key not configured on the server. Set RSA_PRIVATE_KEY env var.';
    console.error(msg);
    throw new Error(msg);
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
  } catch (e) {
    if (!looksEncrypted) {
      return value;
    }

    console.error("RSA Decryption Error:", e);
    throw new Error('Invalid encrypted parameter');
  }
};

const register = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const decryptedPassword = decryptParam(password);
    // Check if user already exists
    const userExists = await findUserByEmail(email);
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Create user (returns { user, verificationToken })
    const { user, verificationToken } = await createUser({
      name,
      email,
      password: decryptedPassword,
      role: "job_seeker",
    });

    // Send verification email
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const verifyUrl = `${frontendUrl}/verify-email?token=${encodeURIComponent(verificationToken)}`;
    await sendVerificationEmail(user, verifyUrl);

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
    console.error("Error registering user:", error);
    if (error.message === "Invalid encrypted parameter" || error.message.includes("RSA private key not configured")) {
      return res.status(400).json({ message: "Invalid encrypted password" });
    }
    return res.status(500).json({ message: "Server error" });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const decryptedPassword = decryptParam(password);
    // Check if user exists
    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Check if password is correct
    const isPasswordValid = await verifyPassword(decryptedPassword, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Check if user is verified
    if (!user.isVerified) {
      return res.status(403).json({ message: "Please verify your email address to log in." });
    }

    if (user.isSuspended) {
      return res.status(403).json({ message: "Your account has been suspended by an administrator. Please contact support for more information." });
    }

    // Generate token and set cookie
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
    console.error("Error logging in:", error);
    if (error.message === "Invalid encrypted parameter" || error.message.includes("RSA private key not configured")) {
      return res.status(400).json({ message: "Invalid encrypted password" });
    }
    return res.status(500).json({
      message: "Server error",
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined
    });
  }
};

const logout = async (req, res) => {
  if (req.user && req.user.id) {
    await updateRefreshToken(req.user.id, null);
  }
  res.cookie("jwt", "", {
    expires: new Date(0),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });
  return res.status(200).json({
    status: "success",
    message: "Logged out successfully",
  });
};

const getMe = async (req, res) => {
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
  } catch (e) {
    return res.status(500).json({ message: "Server error" });
  }
};

const refresh = async (req, res) => {
  try {
    const refreshToken = req.cookies.jwt;
    if (!refreshToken) {
      return res.status(401).json({ message: "Not authorized, no refresh token" });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);

    // Find user by ID to get their stored refresh token
    const user = await findUserById(decoded.id);
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ message: "Not authorized, invalid refresh token" });
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user.id, user.role, res);

    // Save new refresh token in DB (Refresh Token Rotation)
    await updateRefreshToken(user.id, newRefreshToken);

    res.status(200).json({
      status: "success",
      data: {
        token: accessToken
      }
    });
  } catch (error) {
    console.error("Error refreshing token:", error);
    return res.status(401).json({ message: "Not authorized, refresh token failed" });
  }
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
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
    console.error("Error requesting password reset:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

const resetPasswordController = async (req, res) => {
  const { token, password } = req.body;

  try {
    const decryptedPassword = decryptParam(password);
    const didReset = await resetPassword(token, decryptedPassword);

    if (!didReset) {
      return res.status(400).json({ message: "Password reset link is invalid or expired" });
    }

    return res.status(200).json({
      status: "success",
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error("Error resetting password:", error);
    if (error.message === "Invalid encrypted parameter" || error.message.includes("RSA private key not configured")) {
      return res.status(400).json({ message: "Invalid encrypted password" });
    }
    return res.status(500).json({ message: "Server error" });
  }
};

const verifyEmail = async (req, res) => {
  const { token } = req.body;
  try {
    const verified = await verifyEmailToken(token);
    if (!verified) {
      return res.status(400).json({ message: "Verification token is invalid or has expired." });
    }

    return res.status(200).json({
      status: "success",
      message: "Email verified successfully.",
    });
  } catch (error) {
    console.error("Error verifying email:", error);
    return res.status(500).json({ message: "Server error" });
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
};
