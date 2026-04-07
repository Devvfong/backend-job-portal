import express from "express";
import helmet from "helmet";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import session from "express-session";
import pgSimple from "connect-pg-simple";
import passport from "./config/passport.js";
import { apiReference } from "@scalar/express-api-reference";
import { connectDB, disconnectDB } from "./config/db.js";
import authRoutes from "./routes/auth.routes.js";
import jobroutes from "./routes/job.routes.js";
import userroutes from "./routes/user.routes.js";
import companyroutes from "./routes/company.routes.js";
import applicationRoute from "./routes/application.route.js";
import githubAuthRoutes from "./routes/github.routes.js";
import openApiDocument from "./utils/openapi.js";
import protect from "./middlewares/protect.middleware.js";
import authorize from "./middlewares/authorize.middleware.js";

dotenv.config(); // Load environment variables from .env file
await connectDB(); // Connect to the database when the server starts
const app = express(); // Create an Express application
app.set("trust proxy", 1);
app.use(helmet({
  contentSecurityPolicy: false,
}));
// Serve static files from the public directory
app.use(express.static("public"));
const PORT = process.env.PORT || 3000;
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
app.use("/api/v1/applications", applicationRoute);
app.use("/auth", githubAuthRoutes);
app.get("/openapi.json", protect, authorize("company_admin"), (req, res) => {
  res.status(200).json(openApiDocument);
});

app.get(
  "/docs",
  protect,
  authorize("company_admin"),
  apiReference({
    theme: "kepler",
    spec: {
      content: openApiDocument,
    },
  }),
);

// Landing page is served statically from public/index.html
const server = app.listen(PORT || 3000, "0.0.0.0", () => {
  console.log(`Server is running on port ${PORT}`);
});
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
