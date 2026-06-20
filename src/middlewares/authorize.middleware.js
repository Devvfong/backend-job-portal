import { UnauthorizedError, ForbiddenError } from '../lib/errors.js';

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new UnauthorizedError("Not authenticated"));
    }

    if (req.user.role !== "super_admin" && !roles.includes(req.user.role)) {
      return next(new ForbiddenError("Forbidden: insufficient permissions"));
    }

    next();
  };
};

export default authorize;
