import { BadRequestError } from '../lib/errors.js';

const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const errors = result.error.issues.map((e) => ({
      field: e.path.join("."),
      message: e.message,
    }));
    const err = new BadRequestError("Validation failed");
    err.errors = errors;
    return next(err);
  }
  req.body = result.data;
  next();
};

export default validate;
