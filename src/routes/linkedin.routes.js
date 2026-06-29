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
