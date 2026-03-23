import { PrismaClient } from "@prisma/client";

//make instance
const prisma = new PrismaClient();

const connectDB = async () => {
  try {
    await prisma.$connect();
    console.log("Database connected successfully");
  } catch (error) {
    console.error("Database connection failed:", error);
    throw error; // Rethrow the error to be handled by the caller
  }
};

const disconnectDB = async () => {
  await prisma.$disconnect();
  console.log("Database disconnected successfully");
};

export { prisma, connectDB, disconnectDB };
