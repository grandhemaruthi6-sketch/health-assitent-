import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/database.js';

const JWT_SECRET = process.env.JWT_SECRET || 'healthcopilot_jwt_secret_key_2026';

export class AuthService {
  /**
   * Register a new user
   */
  static async register({ email, name, phone, password, bloodGroup = null, age = null }) {
    if (!email || !password || !name) {
      throw new Error('Email, password, and name are required.');
    }

    const cleanEmail = email.toLowerCase().trim();
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(cleanEmail);
    if (existing) {
      throw new Error('A user with this email address already exists.');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const userId = uuidv4();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO users (id, email, name, phone, password_hash, blood_group, age, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(userId, cleanEmail, name.trim(), phone || null, passwordHash, bloodGroup, age, now, now);

    const token = this.generateToken({ id: userId, email: cleanEmail, name: name.trim() });

    return {
      user: {
        id: userId,
        email: cleanEmail,
        name: name.trim(),
        phone: phone || null,
        bloodGroup,
        age
      },
      token
    };
  }

  /**
   * Login user with email & password
   */
  static async login({ email, password }) {
    if (!email || !password) {
      throw new Error('Email and password are required.');
    }

    const cleanEmail = email.toLowerCase().trim();
    const userRow = db.prepare('SELECT * FROM users WHERE email = ?').get(cleanEmail);
    if (!userRow) {
      throw new Error('Invalid email or password.');
    }

    const isValid = await bcrypt.compare(password, userRow.password_hash);
    if (!isValid) {
      throw new Error('Invalid email or password.');
    }

    const token = this.generateToken({
      id: userRow.id,
      email: userRow.email,
      name: userRow.name
    });

    return {
      user: {
        id: userRow.id,
        email: userRow.email,
        name: userRow.name,
        phone: userRow.phone,
        bloodGroup: userRow.blood_group,
        age: userRow.age
      },
      token
    };
  }

  /**
   * Synchronize authenticated Firebase user session into local store
   * Never stores or requires raw passwords
   */
  static async syncFirebaseUser({ uid, email, name, phone = null }) {
    if (!email) {
      throw new Error('Email is required to synchronize user session.');
    }

    const cleanEmail = email.toLowerCase().trim();
    let userRow = db.prepare('SELECT * FROM users WHERE email = ?').get(cleanEmail);
    const now = new Date().toISOString();

    if (!userRow) {
      const userId = uid || uuidv4();
      const userName = (name && name.trim()) || cleanEmail.split('@')[0];
      db.prepare(`
        INSERT INTO users (id, email, name, phone, password_hash, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(userId, cleanEmail, userName, phone || null, 'FIREBASE_AUTH_MANAGED', now, now);
      userRow = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    }

    const token = this.generateToken({
      id: userRow.id,
      email: userRow.email,
      name: userRow.name
    });

    return {
      user: {
        id: userRow.id,
        email: userRow.email,
        name: userRow.name,
        phone: userRow.phone,
        bloodGroup: userRow.blood_group,
        age: userRow.age
      },
      token
    };
  }

  /**
   * Get user profile by ID
   */
  static getUserById(userId) {
    const user = db.prepare(`
      SELECT id, email, name, phone, blood_group as bloodGroup, age, created_at as createdAt
      FROM users WHERE id = ?
    `).get(userId);

    return user || null;
  }

  /**
   * Generate JWT token
   */
  static generateToken(payload) {
    return jwt.sign(
      {
        id: payload.id,
        email: payload.email,
        name: payload.name
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
  }

  /**
   * Verify JWT token
   */
  static verifyToken(token) {
    return jwt.verify(token, JWT_SECRET);
  }
}
