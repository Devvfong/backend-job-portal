import jwt from "jsonwebtoken";

const isProduction = process.env.NODE_ENV === "production";

export const refreshCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "none" : "strict",
  maxAge: 1 * 24 * 60 * 60 * 1000,
};

const generateTokens = (userId, role, res) => {
  if (!process.env.JWT_REFRESH_SECRET) {
    throw new Error("JWT_REFRESH_SECRET must be set in environment");
  }

  // 1. Access Token (Short-lived, eg. 5 mins)
  const accessToken = jwt.sign({ id: userId, role: role }, process.env.JWT_SECRET, {
    expiresIn: "5m",
  });

  // 2. Refresh Token (Long-lived, eg. 1 day) — must use a different secret
  const refreshToken = jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: "1d",
  });

  // Cross-origin frontend (nexthire.devqii.me) needs SameSite=None in production.
  res.cookie("jwt", refreshToken, refreshCookieOptions);

  // Only return the Access Token (and optionally the Refresh Token if you need it in controller)
  return { accessToken, refreshToken };
};

export default generateTokens;
