import jwt from "jsonwebtoken";
import { getSetting } from "../config/settings.cache.js";

const maintenanceMiddleware = (req, res, next) => {
  // If maintenance mode is off, proceed
  if (getSetting("maintenance_mode") !== "true") {
    return next();
  }

  // Allow authentication routes so admins can log in
  if (req.path.startsWith("/api/v1/auth")) {
    return next();
  }

  // Extract token to check if user is a super_admin
  let token;
  if (req.headers.authorization && /^bearer/i.test(req.headers.authorization)) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.query && req.query.token) {
    token = req.query.token;
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded && decoded.role === "super_admin") {
        return next();
      }
    } catch {
      // Ignore token verification errors here, they will be blocked below
    }
  }

  // Otherwise block
  return res.status(503).json({
    success: false,
    message: "Platform is currently under maintenance. Please check back later.",
  });
};

export default maintenanceMiddleware;
