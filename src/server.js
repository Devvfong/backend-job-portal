import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import session from "express-session";
import passport from "./config/passport.js";
import { apiReference } from "@scalar/express-api-reference";
import { connectDB, disconnectDB } from "./config/db.js";
import authRoutes from "./routes/auth.routes.js";
import jobroutes from "./routes/job.routes.js";
import userroutes from "./routes/user.routes.js";
import companyroutes from "./routes/company.routes.js";
import githubAuthRoutes from "./routes/github.routes.js";
import openApiDocument from "./utils/openapi.js";

dotenv.config(); // Load environment variables from .env file
connectDB(); // Connect to the database when the server starts
const app = express(); // Create an Express application
const PORT = process.env.PORT || 3000;
app.use(express.json());
app.use(cookieParser()); // Middleware to parse cookies from incoming requests
app.use(
  session({
    secret: process.env.SESSION_SECRET || "supersecret",
    resave: false,
    saveUninitialized: false,
  }),
);
app.use(passport.initialize());
app.use(passport.session());
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/jobs", jobroutes);
app.use("/api/v1/users", userroutes);
app.use("/api/v1/companies", companyroutes);
app.use("/auth", githubAuthRoutes);
app.get("/openapi.json", (req, res) => {
  res.status(200).json(openApiDocument);
});

app.get(
  "/docs",
  apiReference({
    theme: "kepler",
    url: "/openapi.json",
  }),
);

const server = app.listen(process.env.PORT || 3000, "0.0.0.0", () => {
  console.log(`Server is running on port ${PORT}`);
});

app.get("/", (req, res) => {
  res.send("Welcome to the Job Portal API");
});
// =========================================================================================================

// ================================================================================================================
// This for unhandle promise rejection, for example when database connection fails
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
  server.close(async () => {
    await disconnectDB();
    process.exit(1);
  });
});

// This for uncaught exception, for example when there is an error in the code that is not handled
process.on("uncaughtException", async (err) => {
  console.error("Uncaught Exception:", err);
  await disconnectDB();
  process.exit(1);
});

// This for graceful shutdown, for example when the server is stopped or restarted
process.on("SIGINT", async () => {
  console.log("SIGINT received, shutting down gracefully...");
  await disconnectDB();
  process.exit(0);
});
// ================================================================================================================
