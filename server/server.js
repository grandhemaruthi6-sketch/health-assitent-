import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { runMigrations } from './db/migrations.js';
import { ocrRouter } from './routes/ocrRoutes.js';
import { clinicalRouter } from './routes/clinicalRoutes.js';
import { authRouter } from './routes/authRoutes.js';
import { hospitalRouter } from './routes/hospitalRoutes.js';
import { medicalRecordRouter } from './routes/medicalRecordRoutes.js';
import { voiceRouter } from './routes/voiceRoutes.js';
import { continuityRouter } from './routes/continuityRoutes.js';

// Load environment variables from .env
dotenv.config();

// Run database migrations
try {
  runMigrations();
} catch (migErr) {
  console.error('[Database Migration Failure]', migErr);
}

export const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Base API route
app.get('/api', (req, res) => {
  res.json({
    app: 'HealthCopilot AI Backend',
    version: '1.0.0',
    endpoints: {
      ocrHealth: 'GET /api/ocr/health',
      ocrProcess: 'POST /api/ocr/process',
      clinicalAnalyze: 'POST /api/clinical/analyze',
      clinicalCategories: 'GET /api/clinical/categories',
      authRegister: 'POST /api/auth/register',
      authLogin: 'POST /api/auth/login',
      authMe: 'GET /api/auth/me',
      hospitals: 'GET, POST /api/hospitals',
      visits: 'POST /api/visits',
      reports: 'GET, POST /api/reports',
      timeline: 'GET /api/timeline'
    }
  });
});

// Routers
app.use('/api/auth', authRouter);
app.use('/api/hospitals', hospitalRouter);
app.use('/api', medicalRecordRouter); // /api/visits, /api/reports, /api/timeline
app.use('/api/ocr', ocrRouter);
app.use('/api/clinical', clinicalRouter);
app.use('/api/voice', voiceRouter);
app.use('/api', continuityRouter);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Backend Unhandled Error]', err);
  res.status(500).json({
    success: false,
    error: {
      code: 'UNHANDLED_EXCEPTION',
      message: err.message || 'Internal server error'
    }
  });
});

import { fileURLToPath } from 'url';

// Start listening if run directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  app.listen(PORT, () => {
    console.log(`[HealthCopilot Backend] OCR Service running on http://localhost:${PORT}`);
    console.log(`[HealthCopilot Backend] OCR Health check: http://localhost:${PORT}/api/ocr/health`);
  });
}
