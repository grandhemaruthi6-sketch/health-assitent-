import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { AuthService } from '../services/authService.js';
import { requireAuth } from '../middleware/authMiddleware.js';

export const authRouter = Router();

/**
 * POST /api/auth/register
 * Register a new user account
 */
authRouter.post('/register', async (req, res, next) => {
  try {
    const { email, password, name, phone, bloodGroup, age } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Email, password, and full name are required.'
        }
      });
    }

    const result = await AuthService.register({ email, password, name, phone, bloodGroup, age });
    res.status(201).json({
      success: true,
      data: result
    });
  } catch (err) {
    if (err.message.includes('already exists')) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'USER_ALREADY_EXISTS',
          message: err.message
        }
      });
    }
    next(err);
  }
});

/**
 * POST /api/auth/login
 * Authenticate existing user and issue session JWT
 */
authRouter.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Email and password are required.'
        }
      });
    }

    const result = await AuthService.login({ email, password });
    res.json({
      success: true,
      data: result
    });
  } catch (err) {
    if (err.message.includes('Invalid email or password')) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: err.message
        }
      });
    }
    next(err);
  }
});

/**
 * GET /api/auth/me
 * Retrieve currently authenticated user profile
 */
authRouter.get('/me', requireAuth, (req, res) => {
  const user = AuthService.getUserById(req.user.id);
  if (!user) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'USER_NOT_FOUND',
        message: 'User account not found.'
      }
    });
  }

  res.json({
    success: true,
    data: { user }
  });
});

/**
 * POST /api/auth/firebase-sync
 * Synchronize authenticated Firebase user session into local SQLite store
 */
authRouter.post('/firebase-sync', async (req, res, next) => {
  try {
    const { uid, email, name, phone, idToken } = req.body;
    let verifiedUid = uid;
    let verifiedEmail = email;

    // If a Firebase ID token is provided, verify project issuer and audience claims
    if (idToken) {
      try {
        const decoded = jwt.decode(idToken);
        const expectedProjectId = process.env.VITE_FIREBASE_PROJECT_ID || 'health-assitent-app';
        if (decoded && decoded.aud === expectedProjectId && decoded.iss === `https://securetoken.google.com/${expectedProjectId}`) {
          verifiedUid = decoded.sub || uid;
          verifiedEmail = decoded.email || email;
        }
      } catch (tokenErr) {
        console.warn('[firebase-sync] ID token validation warning:', tokenErr.message);
      }
    }

    if (!verifiedEmail) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Email is required to synchronize session.'
        }
      });
    }

    const result = await AuthService.syncFirebaseUser({ 
      uid: verifiedUid, 
      email: verifiedEmail, 
      name, 
      phone 
    });
    res.json({
      success: true,
      data: result
    });
  } catch (err) {
    next(err);
  }
});
