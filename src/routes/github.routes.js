import { Router } from "express";
import passport from "../config/passport.js";
import generateTokens from "../utils/generateToken.js";
import { updateRefreshToken } from "../services/auth.service.js";

const router = Router();

function frontendOAuthCallbackUrl(token) {
  const frontendUrl = (process.env.FRONTEND_URL || "https://nexthire.devqii.me").replace(/\/$/, "");
  return `${frontendUrl}/auth/callback?token=${encodeURIComponent(token)}`;
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
    // Successful authentication
    // Generate JWT and set it as a cookie
    const { accessToken, refreshToken } = generateTokens(req.user.id, req.user.role, res);
    updateRefreshToken(req.user.id, refreshToken).catch(console.error);

    res.redirect(frontendOAuthCallbackUrl(accessToken));
  },
);

export default router;

