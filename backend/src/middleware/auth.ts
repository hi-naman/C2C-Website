import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '../utils/jwt';

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'You must be logged in' 
    });
  }

  try {
    const payload = verifyToken(token);
    req.user = payload as any;
    next();
  } catch {
    return res.status(401).json({ 
      success: false, 
      message: 'Invalid or expired token. Please log in again.' 
    });
  }
};

export const requireSenior = (req: Request, res: Response, next: NextFunction) => {
  const user = req.user as unknown as JwtPayload;

  if (!user) {
    return res.status(401).json({ success: false, message: 'Not logged in' });
  }

  if (user.role !== 'SENIOR' && user.role !== 'ADMIN') {
    return res.status(403).json({ 
      success: false, 
      message: 'Only seniors and admins can do this' 
    });
  }

  next();
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  const user = req.user as unknown as JwtPayload;

  if (!user) {
    return res.status(401).json({ success: false, message: 'Not logged in' });
  }

  if (user.role !== 'ADMIN') {
    return res.status(403).json({ 
      success: false, 
      message: 'Only admins can do this' 
    });
  }

  next();
};

// Optional auth — attaches user if token exists, but doesn't reject if missing
export const optionalAuthenticate = (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies?.token;

  if (!token) {
    // no token — just continue without user
    return next();
  }

  try {
    const payload = verifyToken(token);
    req.user = payload as any;
  } catch {
    // invalid token — just continue without user
    // don't reject — it's optional
  }

  next();
};