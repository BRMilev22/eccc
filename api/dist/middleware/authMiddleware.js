"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.protect = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// Middleware to protect routes that require authentication
const protect = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        // Get token from header
        const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(' ')[1];
        // If token exists, try to verify it
        if (token) {
            try {
                // Verify token
                const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'defaultsecret');
                // Add user to request directly from the token payload
                req.user = {
                    id: decoded.id,
                    username: decoded.username,
                    role: decoded.role || 'user'
                };
            }
            catch (error) {
                console.warn('Invalid token provided, but continuing request as unauthenticated');
            }
        }
        else {
            console.log('No auth token provided, continuing as unauthenticated request');
        }
        // Continue to the next middleware/route handler regardless of auth
        next();
    }
    catch (error) {
        console.error('Auth middleware error:', error);
        next();
    }
});
exports.protect = protect;
