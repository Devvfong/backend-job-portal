import jwt from "jsonwebtoken";

const generateToken = (userId, role, res) => {
  const token = jwt.sign({ id: userId, role: role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "1d",
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
