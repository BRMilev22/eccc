"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminMiddleware = exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
// Modified to make authentication optional
const authMiddleware = (req, res, next) => {
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
            const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
            // Add user data to request object
            req.user = decoded;
            next();
        }
        catch (error) {
            // If token is invalid, continue as guest
            console.warn('Invalid token provided, but continuing request as unauthenticated');
            next();
        }
    }
    catch (error) {
        console.error('Auth middleware error:', error);
        // Continue anyway rather than blocking
        next();
    }
};
exports.authMiddleware = authMiddleware;
const adminMiddleware = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        res.status(403).json({ error: 'Forbidden: Admin access required' });
        return;
    }
    next();
};
exports.adminMiddleware = adminMiddleware;
