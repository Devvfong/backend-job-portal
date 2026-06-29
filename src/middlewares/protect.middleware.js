import { UnauthorizedError, ForbiddenError } from '../lib/errors.js';
import jwt from "jsonwebtoken";
import { prisma } from "../config/db.js";

const protect = async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    /^bearer/i.test(req.headers.authorization)
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  
  if (!token && req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return next(new UnauthorizedError("Not authorized, no token"));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isSuspended: true,
        companyId: true,
        company: {
          select: {
            companyName: true,
            logo: true,
            isVerified: true,
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
      return next(new UnauthorizedError("Not authorized, user not found"));
    }
    if (req.user.isSuspended) {
      return next(new ForbiddenError("Your account has been suspended"));
    }
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(new UnauthorizedError("Not authorized, token expired"));
    }
    return next(new UnauthorizedError("Not authorized, invalid token"));
  }
};

const optionalProtect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && /^bearer/i.test(req.headers.authorization)) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies?.token) {
    token = req.cookies.token;
  }

  if (!token) return next();

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isSuspended: true,
        companyId: true,
        company: {
          select: {
            companyName: true,
            logo: true,
            isVerified: true,
          },
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
  } catch {
    // Invalid or expired token — proceed as unauthenticated guest
  }

  return next();
};

export default protect;
export { optionalProtect };
