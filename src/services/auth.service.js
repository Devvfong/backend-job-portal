import { prisma } from "../config/db.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";

// Find a user by their email address
const findUserByEmail = async (email) => {
  const user = await prisma.user.findUnique({
    where: {
      email: email,
    },
  });
  return user;
};

// Find a user by their ID
const findUserById = async (id) => {
  const user = await prisma.user.findUnique({
    where: {
      id: id,
    },
  });
  return user;
};

const createUser = async ({ name, email, password, role }) => {
  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Generate verification token
  const verificationToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto.createHash("sha256").update(verificationToken).digest("hex");
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  // Create user in database
  const user = await prisma.user.create({
    data: {
      name: name,
      email: email,
      password: hashedPassword,
      role: role,
      skills: [],
      isVerified: false,
      verificationToken: hashedToken,
      verificationExpires: expires,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });
  return { user, verificationToken };
};

const verifyPassword = async (plainPassword, hashedPassword) => {
  const isMatch = await bcrypt.compare(plainPassword, hashedPassword);
  return isMatch;
};

const updateRefreshToken = async (userId, refreshToken) => {
  await prisma.user.update({
    where: { id: userId },
    data: { refreshToken },
  });
};

const createPasswordResetToken = async (userId) => {
  const resetToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");
  const expires = new Date(Date.now() + 15 * 60 * 1000);

  await prisma.user.update({
    where: { id: userId },
    data: {
      resetPasswordToken: hashedToken,
      resetPasswordExpires: expires,
    },
  });

  return resetToken;
};

const resetPassword = async (token, password) => {
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const result = await prisma.user.updateMany({
    where: {
      resetPasswordToken: hashedToken,
      resetPasswordExpires: {
        gt: new Date(),
      },
    },
    data: {
      password: hashedPassword,
      resetPasswordToken: null,
      resetPasswordExpires: null,
      refreshToken: null,
    },
  });

  return result.count > 0;
};

const verifyEmailToken = async (token) => {
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  // Find user by verification token and expiration
  const user = await prisma.user.findFirst({
    where: {
      verificationToken: hashedToken,
      verificationExpires: {
        gt: new Date(),
      },
    },
  });

  if (!user) {
    return false;
  }

  // Update user: isVerified = true, clear token and expiration
  await prisma.user.update({
    where: { id: user.id },
    data: {
      isVerified: true,
      verificationToken: null,
      verificationExpires: null,
    },
  });

  return true;
};

export {
  findUserByEmail,
  createUser,
  verifyPassword,
  updateRefreshToken,
  findUserById,
  createPasswordResetToken,
  resetPassword,
  verifyEmailToken,
};
