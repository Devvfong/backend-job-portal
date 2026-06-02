import { Router } from "express";
import passport from "../config/passport.js";
import generateTokens from "../utils/generateToken.js";
import { updateRefreshToken } from "../services/auth.service.js";

const router = Router();

function frontendOAuthCallbackUrl(token) {
    const frontendUrl = (process.env.FRONTEND_URL || "https://jobportal.devqii.me").replace(/\/$/, "");
    return `${frontendUrl}/auth/callback?token=${encodeURIComponent(token)}`;
}

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
        const { accessToken, refreshToken } = generateTokens(req.user.id, req.user.role, res);
        updateRefreshToken(req.user.id, refreshToken).catch(console.error);

        res.redirect(frontendOAuthCallbackUrl(accessToken));
    },
);

export default router;
