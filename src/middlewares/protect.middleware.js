import jwt from "jsonwebtoken";
import { prisma } from "../config/db.js";

const protect = async (req, res, next) => {
  console.log("Reached to Middleware");

  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token && req.cookies && req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true, //to check if the user is company admin or not in the authorize middleware
        companyId: true,
        company: {
          select: {
            companyName: true,
            logo: true
          }
        },
        avatar: true,
        headline: true,
        bio: true,
        location: true,
        phone: true,
        skills: true,
        resume: true,
      },
    });
    if (!req.user) {
      return res
        .status(401)
        .json({ message: "Not authorized, user not found" });
    }
    console.log("Protect Middleware - User:", req.user.id, "Company:", req.user.company ? req.user.company.companyName : "No Company");
    next();
  } catch {
    return res.status(401).json({ message: "Not authorized, invalid token" });
  }
};

export default protect;
