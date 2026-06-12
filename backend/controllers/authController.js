import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';

const COOKIE_NAME = process.env.COOKIE_NAME || 'moza_token';
const TOKEN_TTL = process.env.JWT_EXPIRES_IN || '7d';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getCookieOptions() {
  const isProduction = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProduction,
    // Cross-site cookies (e.g. Vercel frontend <-> Render backend) require
    // SameSite=None, which itself requires Secure. Local dev (http) keeps
    // Lax since SameSite=None without Secure is rejected by browsers.
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  };
}

function signToken(user) {
  return jwt.sign(
    { id: user.id, name: user.name, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: TOKEN_TTL }
  );
}

export async function register(req, res) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are all required.' });
    }

    if (typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({ message: 'Name must be at least 2 characters long.' });
    }

    if (typeof email !== 'string' || !EMAIL_REGEX.test(email)) {
      return res.status(400).json({ message: 'Please provide a valid email address.' });
    }

    if (typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [normalizedEmail]);
    if (existing.length > 0) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [name.trim(), normalizedEmail, passwordHash, 'customer']
    );

    const user = {
      id: result.insertId,
      name: name.trim(),
      email: normalizedEmail,
      role: 'customer'
    };

    const token = signToken(user);
    res.cookie(COOKIE_NAME, token, getCookieOptions());

    return res.status(201).json({
      message: 'Account created successfully.',
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ message: 'Something went wrong while creating your account.' });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    const [rows] = await pool.query(
      'SELECT id, name, email, password_hash, role FROM users WHERE email = ?',
      [normalizedEmail]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const user = rows[0];
    const passwordMatches = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatches) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = signToken(user);
    res.cookie(COOKIE_NAME, token, getCookieOptions());

    return res.status(200).json({
      message: 'Logged in successfully.',
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ message: 'Something went wrong while logging in.' });
  }
}

export async function logout(req, res) {
  res.clearCookie(COOKIE_NAME, getCookieOptions());
  return res.status(200).json({ message: 'Logged out successfully.' });
}

export async function me(req, res) {
  return res.status(200).json({ user: req.user });
}
