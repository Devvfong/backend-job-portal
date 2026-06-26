import {
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
} from '../lib/errors.js';
import generateTokens from "../utils/generateToken.js";
import { authenticator } from 'otplib';
import qrcode from 'qrcode';
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

let privateKey;
try {
  if (process.env.RSA_PRIVATE_KEY) {
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
  } catch (e) {
    if (!looksEncrypted) {
      return value;
    }
    throw new BadRequestError('Invalid encrypted parameter');
  }
};

const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const decryptedPassword = decryptParam(password);

    const userExists = await findUserByEmail(email);
    if (userExists) {
      throw new BadRequestError("User already exists");
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

    if (user.twoFactorEnabled) {
      // Withhold full auth, generate temporary token
      const temp2faToken = jwt.sign(
        { id: user.id },
        process.env.JWT_SECRET,
        { expiresIn: "5m" }
      );
      
      return res.status(200).json({
        status: "success",
        message: "2FA required",
        data: {
          requires2FA: true,
          temp2faToken,
        },
      });
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

const login2FA = async (req, res, next) => {
  try {
    const { token, code } = req.body;
    if (!token || !code) {
      throw new BadRequestError("Temporary token and 2FA code are required");
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      throw new UnauthorizedError("Invalid or expired temporary 2FA token");
    }

    const user = await findUserById(decoded.id);
    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      throw new BadRequestError("2FA is not enabled for this user");
    }

    const isValid = authenticator.verify({ token: code, secret: user.twoFactorSecret });
    if (!isValid) {
      throw new UnauthorizedError("Invalid 2FA code");
    }

    const { accessToken, refreshToken } = generateTokens(user.id, user.role, res);
    await updateRefreshToken(user.id, refreshToken);

    return res.status(200).json({
      status: "success",
      message: "User logged in successfully with 2FA",
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

const generate2FA = async (req, res, next) => {
  try {
    const user = await findUserById(req.user.id);
    
    // Generate new secret
    const secret = authenticator.generateSecret();
    
    // Save to DB
    await prisma.user.update({
      where: { id: user.id },
      data: { twoFactorSecret: secret },
    });

    const otpauthUrl = authenticator.keyuri(user.email, 'NextHire', secret);
    
    // Generate QR Code data URL
    const qrCodeDataUrl = await qrcode.toDataURL(otpauthUrl);

    res.status(200).json({
      status: "success",
      data: {
        secret,
        qrCodeUrl: qrCodeDataUrl,
      },
    });
  } catch (error) {
    next(error);
  }
};

const verify2FA = async (req, res, next) => {
  try {
    const { code } = req.body;
    const user = await findUserById(req.user.id);

    if (!user.twoFactorSecret) {
      throw new BadRequestError("2FA secret not generated yet");
    }

    const isValid = authenticator.verify({ token: code, secret: user.twoFactorSecret });
    if (!isValid) {
      throw new BadRequestError("Invalid 2FA code");
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { twoFactorEnabled: true },
    });

    res.status(200).json({
      status: "success",
      message: "2FA successfully enabled",
    });
  } catch (error) {
    next(error);
  }
};

const disable2FA = async (req, res, next) => {
  try {
    await prisma.user.update({
      where: { id: req.user.id },
      data: { 
        twoFactorEnabled: false,
        twoFactorSecret: null 
      },
    });

    res.status(200).json({
      status: "success",
      message: "2FA successfully disabled",
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
      expires: new Date(0),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
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

export {
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
};
