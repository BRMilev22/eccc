import { Request, Response } from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { createUser, getUserByUsername, User } from '../models/user';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Helper function to hash password with SHA-256
const hashPassword = (password: string): string => {
  return crypto.createHash('sha256').update(password).digest('hex');
};

// Register a new user
export const register = async (req: Request, res: Response): Promise<void> => {
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
    const newUser = await createUser({
      username,
      email,
      password: hashedPassword,
      role: 'user' // Default role is user
    });

    // Generate JWT token
    const token = jwt.sign(
      { id: newUser.id, username: newUser.username, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

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
  } catch (error: any) {
    console.error('Error in register:', error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      // MySQL duplicate entry error
      if (error.message.includes('username')) {
        res.status(409).json({ error: 'Username already exists' });
      } else if (error.message.includes('email')) {
        res.status(409).json({ error: 'Email already exists' });
      } else {
        res.status(409).json({ error: 'User already exists' });
      }
      return;
    }
    
    res.status(500).json({ error: 'Failed to register user' });
  }
};

// Login user
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      res.status(400).json({ error: 'Username and password are required' });
      return;
    }

    // Get user
    const user = await getUserByUsername(username);
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
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

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
  } catch (error) {
    console.error('Error in login:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
};

// Helper function to update last login time
const updateLastLogin = async (userId: number): Promise<void> => {
  try {
    const query = 'UPDATE users SET last_login = NOW() WHERE id = ?';
    await (await import('../config/db')).default.execute(query, [userId]);
  } catch (error) {
    console.error('Error updating last login time:', error);
    // Don't throw, just log the error
  }
}; 