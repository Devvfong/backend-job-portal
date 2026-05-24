import jwt from "jsonwebtoken";

const generateTokens = (userId, role, res) => {
  // 1. Access Token (Short-lived, eg. 15 mins)
  const accessToken = jwt.sign({ id: userId, role: role }, process.env.JWT_SECRET, {
    expiresIn: "5m",
  });

  // 2. Refresh Token (Long-lived, eg. 1 days)
  const refreshToken = jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, {
    expiresIn: "1d",
  });

  // Set the Refresh Token inside the Secure HttpOnly Cookie
  res.cookie("jwt", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 1 * 24 * 60 * 60 * 1000, // 1 day
  });

  // Only return the Access Token (and optionally the Refresh Token if you need it in controller)
  return { accessToken, refreshToken };
};

export default generateTokens;
