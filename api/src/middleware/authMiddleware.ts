import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';

// Middleware to protect routes that require authentication
export const protect = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Get token from header
    const token = req.headers.authorization?.split(' ')[1];
    
    // If token exists, try to verify it
    if (token) {
      try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'defaultsecret') as JwtPayload;
        
        // Add user to request directly from the token payload
        (req as any).user = {
          id: decoded.id,
          username: decoded.username,
          role: decoded.role || 'user'
        };
      } catch (error) {
        console.warn('Invalid token provided, but continuing request as unauthenticated');
      }
    } else {
      console.log('No auth token provided, continuing as unauthenticated request');
    }
    
    // Continue to the next middleware/route handler regardless of auth
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    next();
  }
}; 