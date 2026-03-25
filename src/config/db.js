import { PrismaClient } from "@prisma/client";

// Make instance, explicitly passing env DATABASE_URL
const prisma = new PrismaClient({
  datasources: {
    db: { url: process.env.DATABASE_URL } // <-- use the env variable
  }
});

const connectDB = async () => {
  try {
    await prisma.$connect();
    console.log("Database connected successfully");
  } catch (error) {
    console.error("Database connection failed:", error);
    throw error;
  }
};

const disconnectDB = async () => {
  await prisma.$disconnect();
  console.log("Database disconnected successfully");
};

export { prisma, connectDB, disconnectDB };