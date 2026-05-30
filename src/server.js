import express from "express";
import helmet from "helmet";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import cookieParser from "cookie-parser";
import session from "express-session";
import pgSimple from "connect-pg-simple";
import { fileURLToPath } from "url";
import passport from "./config/passport.js";
import { apiReference } from "@scalar/express-api-reference";
import { connectDB, disconnectDB } from "./config/db.js";
import authRoutes from "./routes/auth.routes.js";
import jobroutes from "./routes/job.routes.js";
import userroutes from "./routes/user.routes.js";
import companyroutes from "./routes/company.routes.js";
import categoriesRoutes from "./routes/category.routes.js";
import applicationRoute from "./routes/application.route.js";
import githubAuthRoutes from "./routes/github.routes.js";
import linkedinAuthRoutes from "./routes/linkedin.routes.js";
import statsRoutes from "./routes/stats.routes.js";
import locationRoutes from "./routes/location.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import openApiDocument from "./utils/openapi.js";
import protect from "./middlewares/protect.middleware.js";
import authorize from "./middlewares/authorize.middleware.js";
import "./utils/cron.js"; // Initialize the cron jobs

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env"), override: true }); // Load backend environment variables reliably
// Warn if encryption keys between front-end and back-end do not match (helps SEO/meta decryption issues)
if (process.env.NEXT_PUBLIC_ENCRYPTION_KEY && process.env.NEXT_PUBLIC_ENCRYPTION_KEY !== process.env.ENCRYPTION_KEY) {
  console.warn("⚠️  ENCRYPTION_KEY mismatch: NEXT_PUBLIC_ENCRYPTION_KEY does not equal ENCRYPTION_KEY. Verify CI secrets and redeploy front-end/back-end with matching keys.");
}

// Production preflight: ensure RSA private key is configured (we require env var in production)
if (process.env.NODE_ENV === 'production') {
  if (!process.env.RSA_PRIVATE_KEY) {
    console.error('FATAL: RSA_PRIVATE_KEY is not set in environment. RSA decryption is required in production.');
    console.error('Please add RSA_PRIVATE_KEY to your deployment environment (include full PEM with BEGIN/END lines).');
    // Exit with non-zero so the platform flags the deploy as failed
    process.exit(1);
  }
}
const app = express(); // Create an Express application
app.set("trust proxy", 1);
app.use(helmet({
  contentSecurityPolicy: false,
}));
// Configure CORS to allow the frontend domain and include credentials
app.use(
  cors({
    origin: [
      "https://job-portal.devqii.me",
      "http://localhost:3000",
      "http://127.0.0.1:3000"
    ],
    credentials: true,
  }),
);
// Serve static files from the public directory
app.use(express.static("public"));
const PORT = process.env.PORT || 5000;
app.use(express.json());
app.use(cookieParser()); // Middleware to parse cookies from incoming requests
const pgSession = pgSimple(session);

app.use(
  session({
    store: new pgSession({
      conString: process.env.DATABASE_URL,
      tableName: "session",
    }),
    secret: process.env.SESSION_SECRET || "supersecret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      secure: process.env.NODE_ENV === "production",
    },
  }),
);
app.use(passport.initialize()); // Middleware to initialize passport
app.use(passport.session()); // Middleware to manage user sessions
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/jobs", jobroutes);
app.use("/api/v1/users", userroutes);
app.use("/api/v1/companies", companyroutes);
app.use("/api/v1/categories", categoriesRoutes);
app.use("/api/v1/applications", applicationRoute);
app.use("/api/v1/stats", statsRoutes);
app.use("/api/v1/locations", locationRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.use("/auth", githubAuthRoutes);
app.use("/auth", linkedinAuthRoutes);
const docsPublicEnv = String(process.env.DOCS_PUBLIC || "").trim().toLowerCase();
const docsArePublic =
  docsPublicEnv === "true" ||
  docsPublicEnv === "1" ||
  docsPublicEnv === "yes";
app.get("/openapi.json", ...(docsArePublic ? [] : [protect, authorize("company_admin")]), (req, res) => {
  res.status(200).json(openApiDocument);
});

app.get(
  "/docs",
  ...(docsArePublic ? [] : [protect, authorize("company_admin")]),
  apiReference({
    theme: "kepler",
    fetch: (input, init) => fetch(input, { ...init, credentials: "include" }),
    spec: {
      content: openApiDocument,
    },
  }),
);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("💥 Global Error Handler:", err);
  res.status(err.status || 500).json({
    status: "error",
    message: err.message || "Internal Server Error",
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
});

// Landing page is served statically from public/index.html
const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on port ${PORT}`);
});

// Connect after server boot so docs can still load without DB
connectDB().catch((err) => {
  console.warn("⚠️  Database unavailable. API endpoints may fail until DB is up.");
  console.warn(err?.message || err);
});

// Prevent process from exiting cleanly in environments where event loop might drain
process.stdin.resume();
setInterval(() => { }, 1000 * 60 * 60); // Keep alive every hour
// =========================================================================================================

// ================================================================================================================
// This for unhandle promise rejection, for example when database connection fails
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
  // server.close(async () => {
  //   await disconnectDB();
  //   process.exit(1);
  // });
});

// This for uncaught exception, for example when there is an error in the code that is not handled
process.on("uncaughtException", async (err) => {
  console.error("Uncaught Exception:", err);
  await disconnectDB();
  process.exit(1);
});

// This for graceful shutdown, for example when the server is stopped or restarted
// process.on("SIGINT", async () => {
//   console.log("SIGINT received, shutting down gracefully...");
//   await disconnectDB();
//   process.exit(0);
// });
// ================================================================================================================
