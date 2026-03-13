import jwt from "jsonwebtoken";

const generateToken = (user) => {
  // Create a payload with the user's ID
  const payload = { id: user.id };
  // Sign the token with the secret key and set an expiration time
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
  res.cookie("jwt", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 24 * 60 * 60 * 1000, // 1 day
  });
  return token;
};
export default generateToken;