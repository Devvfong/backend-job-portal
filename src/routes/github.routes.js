import { Router } from "express";
import passport from "../config/passport.js";
import generateTokens from "../utils/generateToken.js";
import { updateRefreshToken } from "../services/auth.service.js";

const router = Router();

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

    // Redirect back to the frontend
    // If you have a specific dashboard route, you can change this to /dashboard
    const frontendUrl = process.env.FRONTEND_URL || "https://devqii.me";
    res.redirect(`${frontendUrl}?token=${accessToken}`);
  },
);

export default router;

