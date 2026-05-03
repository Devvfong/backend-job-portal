import express from "express";
import passport from "passport";
import generateToken from "../utils/generateToken.js";

const router = express.Router();

// Initiate LinkedIn OAuth
router.get(
    "/linkedin",
    passport.authenticate("linkedin", { state: true }),
);

// LinkedIn OAuth callback
router.get(
    "/linkedin/callback",
    passport.authenticate("linkedin", { failureRedirect: "/login" }),
    (req, res) => {
        // Successful authentication
        // Generate JWT and set it as a cookie
        const token = generateToken(req.user.id, req.user.role, res);

        // Redirect back to the frontend
        const frontendUrl = process.env.FRONTEND_URL || "https://devqii.me";
        res.redirect(`${frontendUrl}?token=${token}`);
    },
);

export default router;