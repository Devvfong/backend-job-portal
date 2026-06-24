class AppError extends Error {
  constructor(message, statusCode, code) {
    super(message);
    this.status = statusCode;
    this.code = code || 'ERROR';
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

class BadRequestError extends AppError {
  constructor(message = 'Bad request') {
    super(message, 400, 'BAD_REQUEST');
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403, 'FORBIDDEN');
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Not found') {
    super(message, 404, 'NOT_FOUND');
  }
}

class ConflictError extends AppError {
  constructor(message = 'Conflict') {
    super(message, 409, 'CONFLICT');
  }
}

const resolveOperationalError = (err) => {
  if (err instanceof AppError) return err

  if (err?.name === 'JsonWebTokenError' || err?.name === 'TokenExpiredError') {
    return new UnauthorizedError('Not authorized, invalid token')
  }

  if (err?.name === 'MulterError') {
    return new BadRequestError(err.message || 'Upload failed')
  }

  const message = typeof err?.message === 'string' ? err.message : ''
  if (!message) return null

  if (/^Forbidden/i.test(message) || message === 'Forbidden') {
    return new ForbiddenError(message)
  }
  if (/^Unauthorized/i.test(message) || /^Not authorized/i.test(message)) {
    return new UnauthorizedError(message)
  }
  if (/not found/i.test(message)) {
    return new NotFoundError(message)
  }
  if (/already exists/i.test(message)) {
    return new ConflictError(message)
  }
  if (/required/i.test(message) || /no longer accepting/i.test(message) || /upload failed/i.test(message)) {
    return new BadRequestError(message)
  }

  return null
}

export {
  AppError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  resolveOperationalError,
}
