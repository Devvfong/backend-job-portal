// import { PrismaClient } from "@prisma/client";

// // Make instance, explicitly passing env DATABASE_URL
// const prisma = new PrismaClient({
//   datasources: {
//     db: { url: process.env.DATABASE_URL } // <-- use the env variable
//   }
// });

// const connectDB = async () => {
//   try {
//     await prisma.$connect();
//     console.log("Database connected successfully");
//   } catch (error) {
//     console.error("Database connection failed:", error);
//     throw error;
//   }
// };

// const disconnectDB = async () => {
//   await prisma.$disconnect();
//   console.log("Database disconnected successfully");
// };

// export { prisma, connectDB, disconnectDB };
import { PrismaClient } from "@prisma/client";

// 1. Validate Environment Variable Immediately
if (!process.env.DATABASE_URL) {
  throw new Error(
    "❌ Missing DATABASE_URL environment variable. Check your .env file."
  );
}

// 2. Global Singleton Pattern (Prevents connection leaks during hot-reloading)
// We attach Prisma to globalThis so it survives server restarts in dev
const globalForPrisma = globalThis;

const prisma = globalForPrisma.prisma ?? new PrismaClient({
  datasources: {
    db: { url: process.env.DATABASE_URL }
  },
  // 3. Secure Logging Configuration
  log: process.env.NODE_ENV === "development" 
    ? ["query", "error", "warn"] // Verbose in dev
    : ["error"],                 // Only errors in prod
});

// Store instance in global for next reload
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// 4. Wrapper Functions for Clean API
const connectDB = async () => {
  try {
    await prisma.$connect();
    console.log("✅ Database connected successfully");
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    process.exit(1); // Exit process if DB fails to start
  }
};

const disconnectDB = async () => {
  await prisma.$disconnect();
  console.log("🔌 Database disconnected");
};

export { prisma, connectDB, disconnectDB };