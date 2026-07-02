import { ForbiddenError } from "../lib/errors.js";

const isProduction = process.env.NODE_ENV === "production";

const ALLOWED_ORIGINS = [
  process.env.FRONTEND_URL,
  "https://nexthire.devqii.me",
  "https://next-hire.devqii.me",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
].filter(Boolean);

/**
 * CSRF protection middleware using Origin/Referer header validation.
 * Applied to state-changing methods (POST, PUT, PATCH, DELETE).
 *
 * Skips:
 * - GET, HEAD, OPTIONS (safe methods)
 * - Health check and robots.txt
 * - OAuth callback routes (already validated by Passport)
 * - Requests without Origin/Referer (same-origin or non-browser clients)
 */
const csrfProtection = (req, res, next) => {
  // Only protect state-changing methods
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    return next();
  }

  // Skip non-API routes
  if (!req.path.startsWith("/api/")) {
    return next();
  }

  // Skip health and static endpoints
  if (req.path === "/health" || req.path === "/robots.txt") {
    return next();
  }

  const origin = req.headers.origin;
  const referer = req.headers.referer;

  // If no Origin or Referer header, it's likely a same-origin or non-browser request
  // (e.g., curl, Postman, mobile app) — allow it since CORS handles browser enforcement
  if (!origin && !referer) {
    return next();
  }

  // Validate Origin header
  if (origin) {
    const isAllowed = ALLOWED_ORIGINS.some((allowed) => origin.startsWith(allowed));
    if (!isAllowed) {
      throw new ForbiddenError("CSRF validation failed: invalid origin");
    }
  }

  // Validate Referer header (fallback if Origin not present)
  if (!origin && referer) {
    try {
      const refererUrl = new URL(referer);
      const isAllowed = ALLOWED_ORIGINS.some(
        (allowed) => refererUrl.origin === new URL(allowed).origin
      );
      if (!isAllowed) {
        throw new ForbiddenError("CSRF validation failed: invalid referer");
      }
    } catch (e) {
      if (e instanceof ForbiddenError) throw e;
      throw new ForbiddenError("CSRF validation failed: malformed referer");
    }
  }

  next();
};

export default csrfProtection;
