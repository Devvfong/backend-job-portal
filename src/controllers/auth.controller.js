import generateTokens from "../utils/generateToken.js";
import CryptoJS from 'crypto-js';
import jwt from "jsonwebtoken";
import {
  findUserByEmail,
  createUser,
  verifyPassword,
  updateRefreshToken,
  findUserById
} from "../services/auth.service.js";

const secretKey = process.env.ENCRYPTION_KEY || 'default-secret-key-change-in-prod';

const decryptParam = (encrypted) => {
  try {
    const bytes = CryptoJS.AES.decrypt(encrypted, secretKey);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (e) {
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

    // Create user (hashing handled in service)
    const user = await createUser({
      name,
      email,
      password: decryptedPassword,
      role: "job_seeker", //prevent hacker patch if leak endpoint, only allow register as job seeker, company admin must be created by admin
    });

    // Generate token and set cookie
    const { accessToken, refreshToken } = generateTokens(user.id, user.role, res);
    await updateRefreshToken(user.id, refreshToken);

    return res.status(201).json({
      status: "success",
      message: "User registered successfully",
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        token: accessToken,
      },
    });
  } catch (error) {
    console.error("Error registering user:", error);
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

    // Generate token and set cookie
    const { accessToken, refreshToken } = generateTokens(user.id, user.role, res);
    await updateRefreshToken(user.id, refreshToken);

    return res.status(200).json({
      status: "success",
      message: "User logged in successfully",
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        token: accessToken,
      },
    });
  } catch (error) {
    console.error("Error logging in:", error);
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
    return res.status(200).json({
      status: "success",
      data: {
        ...req.user
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

export { register, login, logout, getMe, refresh };
