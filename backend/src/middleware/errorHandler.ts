import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';

// Global error handler
export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  // log the full error on the server (for debugging)
  console.error('Unhandled error:', err);

  // prisma - record not found
  if (err.code === 'P2025') {
    return res.status(404).json({ success: false, message: 'Resource not found' });
  }

  // prisma - unique constraint violation
  if (err.code === 'P2002') {
    const field = err.meta?.target?.[0] || 'field';
    return res.status(400).json({
      success: false,
      message: `This ${field} is already in use`,
    });
  }

  // default - internal server error
  res.status(500).json({
    success: false,
    message: 'Something went wrong on our end',
    // only show stack trace in development, never in production
    ...(env.NODE_ENV === 'development' && { error: err.message }),
  });
};

// 404 handler - for routes that don't exist
export const notFoundHandler = (_req: Request, res: Response) => {
  res.status(404).json({ success: false, message: 'Route not found' });
};