import { Router } from "express";
import passport from "../config/passport.js";

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
    // Here you can create/find the user in your DB and issue a JWT or session
    res.json({ user: req.user, message: "GitHub login successful" });
  },
);

export default router;
