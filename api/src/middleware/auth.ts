import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface AuthToken {
  id: number;
  username: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthToken;
    }
  }
}

// Modified to make authentication optional
export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Instead of returning 401, continue as guest
      console.log('No auth token provided, continuing as unauthenticated request');
      next();
      return;
    }

    const token = authHeader.split(' ')[1];
    
    try {
      // Verify token
      const decoded = jwt.verify(token, JWT_SECRET) as AuthToken;
      
      // Add user data to request object
      req.user = decoded;
      
      next();
    } catch (error) {
      // If token is invalid, continue as guest
      console.warn('Invalid token provided, but continuing request as unauthenticated');
      next();
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    // Continue anyway rather than blocking
    next();
  }
};

export const adminMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ error: 'Forbidden: Admin access required' });
    return;
  }
  
  next();
}; 