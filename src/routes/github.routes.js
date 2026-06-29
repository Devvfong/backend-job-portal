import { Router } from "express";
import passport from "../config/passport.js";
import generateTokens from "../utils/generateToken.js";
import { updateRefreshToken } from "../services/auth.service.js";
import { getSetting } from "../config/settings.cache.js";

const router = Router();

function frontendCallbackUrl() {
  const frontendUrl = (process.env.FRONTEND_URL || "https://nexthire.devqii.me").replace(/\/$/, "");
  return `${frontendUrl}/auth/callback`;
}

// Start GitHub OAuth login
router.get(
  "/github",
  passport.authenticate("github", { scope: ["user:email"] }),
);

// GitHub OAuth callback
router.get(
  "/github/callback",
  passport.authenticate("github", { failureRedirect: "/login" }),
  (req, res) => {
    if (req.user.role !== "super_admin" && getSetting("maintenance_mode") === "true") {
      const frontendUrl = (process.env.FRONTEND_URL || "https://nexthire.devqii.me").replace(/\/$/, "");
      return res.redirect(`${frontendUrl}/login?error=maintenance`);
    }

    const { refreshToken } = generateTokens(req.user.id, req.user.role, res);
    updateRefreshToken(req.user.id, refreshToken).catch(console.error);

    // Refresh cookie (jwt) is set by generateTokens. Frontend exchanges it via POST /auth/refresh.
    res.redirect(frontendCallbackUrl());
  },
);

export default router;

