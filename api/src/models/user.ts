import pool from '../config/db';

export interface User {
  id?: number;
  username: string;
  email: string;
  password: string;
  role: 'user' | 'admin';
  created_at?: Date;
  last_login?: Date;
}

export const createUser = async (user: User): Promise<User> => {
  const [result] = await pool.execute(
    'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
    [user.username, user.email, user.password, user.role]
  );
  
  const insertId = (result as any).insertId;
  return { ...user, id: insertId };
};

export const getUserByUsername = async (username: string): Promise<User | null> => {
  const [rows] = await pool.execute('SELECT * FROM users WHERE username = ?', [username]);
  const users = rows as User[];
  return users.length ? users[0] : null;
};

export const getUserById = async (id: number): Promise<User | null> => {
  const [rows] = await pool.execute('SELECT * FROM users WHERE id = ?', [id]);
  const users = rows as User[];
  return users.length ? users[0] : null;
};

export const getUserByEmail = async (email: string): Promise<User | null> => {
  const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
  const users = rows as User[];
  return users.length ? users[0] : null;
};

// Get all users (admin only)
export const getAllUsers = async (): Promise<User[]> => {
  const [rows] = await pool.query('SELECT id, username, email, role, created_at, last_login FROM users');
  return rows as User[];
};

// Update user role (admin only)
export const updateUserRole = async (id: number, role: 'user' | 'admin'): Promise<boolean> => {
  const [result] = await pool.execute(
    'UPDATE users SET role = ? WHERE id = ?',
    [role, id]
  );
  
  return (result as any).affectedRows > 0;
}; 