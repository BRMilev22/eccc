"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.login = exports.register = void 0;
const crypto_1 = __importDefault(require("crypto"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const user_1 = require("../models/user");
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
// Helper function to hash password with SHA-256
const hashPassword = (password) => {
    return crypto_1.default.createHash('sha256').update(password).digest('hex');
};
// Register a new user
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username, email, password } = req.body;
        // Validate input
        if (!username || !email || !password) {
            res.status(400).json({ error: 'All fields are required' });
            return;
        }
        if (password.length < 6) {
            res.status(400).json({ error: 'Password must be at least 6 characters long' });
            return;
        }
        // Hash password with SHA-256
        const hashedPassword = hashPassword(password);
        // Create user
        const newUser = yield (0, user_1.createUser)({
            username,
            email,
            password: hashedPassword,
            role: 'user' // Default role is user
        });
        // Generate JWT token
        const token = jsonwebtoken_1.default.sign({ id: newUser.id, username: newUser.username, role: newUser.role }, JWT_SECRET, { expiresIn: '24h' });
        res.status(201).json({
            message: 'User registered successfully',
            user: {
                id: newUser.id,
                username: newUser.username,
                email: newUser.email,
                role: newUser.role,
                isAdmin: newUser.role === 'admin'
            },
            token
        });
    }
    catch (error) {
        console.error('Error in register:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            // MySQL duplicate entry error
            if (error.message.includes('username')) {
                res.status(409).json({ error: 'Username already exists' });
            }
            else if (error.message.includes('email')) {
                res.status(409).json({ error: 'Email already exists' });
            }
            else {
                res.status(409).json({ error: 'User already exists' });
            }
            return;
        }
        res.status(500).json({ error: 'Failed to register user' });
    }
});
exports.register = register;
// Login user
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username, password } = req.body;
        // Validate input
        if (!username || !password) {
            res.status(400).json({ error: 'Username and password are required' });
            return;
        }
        // Get user
        const user = yield (0, user_1.getUserByUsername)(username);
        if (!user) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }
        // Hash the input password and compare with stored hash
        const hashedPassword = hashPassword(password);
        const isPasswordValid = hashedPassword === user.password;
        if (!isPasswordValid) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }
        // Generate JWT token
        const token = jsonwebtoken_1.default.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
        // Update last login time
        // This is a non-blocking operation, we don't need to await it
        if (user.id) {
            updateLastLogin(user.id).catch(err => {
                console.error('Failed to update last login time:', err);
            });
        }
        res.status(200).json({
            message: 'Login successful',
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                isAdmin: user.role === 'admin'
            },
            token
        });
    }
    catch (error) {
        console.error('Error in login:', error);
        res.status(500).json({ error: 'Failed to login' });
    }
});
exports.login = login;
// Helper function to update last login time
const updateLastLogin = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const query = 'UPDATE users SET last_login = NOW() WHERE id = ?';
        yield (yield Promise.resolve().then(() => __importStar(require('../config/db')))).default.execute(query, [userId]);
    }
    catch (error) {
        console.error('Error updating last login time:', error);
        // Don't throw, just log the error
    }
});
