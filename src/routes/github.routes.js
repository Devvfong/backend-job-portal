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

    const { accessToken, refreshToken } = generateTokens(req.user.id, req.user.role, res);
    updateRefreshToken(req.user.id, refreshToken).catch(console.error);

    // Set access token as a non-httpOnly cookie so the frontend can read it
    // without leaking it in the URL (browser history, server logs, Referer header).
    res.cookie("access_token", accessToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 5 * 60 * 1000, // 5 minutes — matches JWT expiry
      path: "/",
    });

    res.redirect(`${frontendCallbackUrl()}?token=${accessToken}`);
  },
);

export default router;

