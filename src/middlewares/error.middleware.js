import { AppError } from '../lib/errors.js';

const errorHandler = (err, req, res, _next) => {
  if (err instanceof AppError) {
    console.warn(`[${req.id || 'N/A'}] ${err.code}: ${err.message}`);
    return res.status(err.status).json({
      status: 'error',
      code: err.code,
      message: err.message,
    });
  }

  if (err.name === 'PrismaClientKnownRequestError' && err.code === 'P2002') {
    const target = err.meta?.target?.[0] || 'resource';
    console.warn(`[${req.id || 'N/A'}] CONFLICT: Unique constraint on ${target}`);
    return res.status(409).json({
      status: 'error',
      code: 'CONFLICT',
      message: `A record with this ${target} already exists`,
    });
  }

  if (err.name === 'PrismaClientKnownRequestError' && err.code === 'P2025') {
    console.warn(`[${req.id || 'N/A'}] NOT_FOUND: ${err.message}`);
    return res.status(404).json({
      status: 'error',
      code: 'NOT_FOUND',
      message: 'The requested resource was not found',
    });
  }

  console.error(`[${req.id || 'N/A'}] Internal Server Error:`, err);
  return res.status(err.status || 500).json({
    status: 'error',
    code: 'INTERNAL_ERROR',
    message: process.env.NODE_ENV === 'development' ? (err.message || 'Internal Server Error') : 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

export default errorHandler;
