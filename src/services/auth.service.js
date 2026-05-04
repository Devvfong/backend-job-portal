import { prisma } from "../config/db.js";
import bcrypt from "bcryptjs";

// Find a user by their email address
const findUserByEmail = async (email) => {
  const user = await prisma.user.findUnique({
    where: {
      email: email,
    },
  });
  return user;
};

const createUser = async ({ name, email, password, role }) => {
  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Create user in database
  const user = await prisma.user.create({
    data: {
      name: name,
      email: email,
      password: hashedPassword,
      role: role,
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });
  return user;
};

const verifyPassword = async (plainPassword, hashedPassword) => {
  const isMatch = await bcrypt.compare(plainPassword, hashedPassword);
  return isMatch;
};

export { findUserByEmail, createUser, verifyPassword, updateRefreshToken, findUserById };
