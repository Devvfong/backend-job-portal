import { Router } from "express";
import passport from "../config/passport.js";
import generateToken from "../utils/generateToken.js";

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
    const token = generateToken(req.user.id, req.user.role, res);

    // Redirect back to the frontend
    // If you have a specific dashboard route, you can change this to /dashboard
    const frontendUrl = process.env.FRONTEND_URL || "https://devqii.me";
    res.redirect(`${frontendUrl}?token=${token}`);
  },
);

export default router;

