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
import prismaClientPackage from "@prisma/client";
const { PrismaClient } = prismaClientPackage;

// Global Singleton Pattern (Prevents connection leaks during hot-reloading)
// We attach Prisma to globalThis so it survives server restarts in dev
const globalForPrisma = globalThis;

const prisma = globalForPrisma.prisma ?? new PrismaClient({
  datasources: {
    db: { url: process.env.DATABASE_URL }
  },
  log: ["error"],
});

// Store instance in global for next reload
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
// Idle disconnect settings (default 10 minutes)
const DEFAULT_IDLE_MS = 10 * 60 * 1000; // 10 minutes
const IDLE_TIMEOUT_MS = process.env.DB_IDLE_TIMEOUT_MS
  ? parseInt(process.env.DB_IDLE_TIMEOUT_MS, 10)
  : DEFAULT_IDLE_MS;

let _idleTimer = null;
let _isConnected = false;
let _connectPromise = null;

function _clearIdleTimer() {
  if (_idleTimer) {
    clearTimeout(_idleTimer);
    _idleTimer = null;
  }
}

function _scheduleIdleDisconnect() {
  if (process.env.NODE_ENV === "production" && process.env.ENABLE_IDLE_DISCONNECT !== "true") {
    return;
  }
  _clearIdleTimer();
  _idleTimer = setTimeout(async () => {
    try {
      await disconnectDB();
      console.log(`🕒 Idle ${IDLE_TIMEOUT_MS}ms reached — disconnected from DB`);
    } catch (err) {
      console.error("Error during idle disconnect:", err);
    }
  }, IDLE_TIMEOUT_MS);
}

// 4. Wrapper Functions for Clean API
const connectDB = async () => {
  if (_isConnected) {
    _scheduleIdleDisconnect();
    return;
  }

  if (_connectPromise) {
    await _connectPromise;
    _scheduleIdleDisconnect();
    return;
  }

  _connectPromise = (async () => {
    try {
      await prisma.$connect();
      _isConnected = true;
      console.log("✅ Database connected successfully");
    } finally {
      _connectPromise = null;
    }
  })();

  await _connectPromise;
  _scheduleIdleDisconnect();
};

const disconnectDB = async () => {
  _clearIdleTimer();
  if (_isConnected) {
    await prisma.$disconnect();
    _isConnected = false;
    console.log("🔌 Database disconnected");
  }
};

// Prisma middleware: reset idle timer around each query and auto-reconnect if needed
prisma.$use(async (params, next) => {
  try {
    if (!_isConnected) {
      // reconnect on-demand before running a query
      await connectDB();
    } else {
      // reset timer before running the query to avoid disconnecting mid-work
      _scheduleIdleDisconnect();
    }
    const result = await next(params);
    // after successful query, schedule disconnect again
    _scheduleIdleDisconnect();
    return result;
  } catch (err) {
    // ensure timer is scheduled to attempt cleanup even on error
    _scheduleIdleDisconnect();
    throw err;
  }
});

export { prisma, connectDB, disconnectDB };
