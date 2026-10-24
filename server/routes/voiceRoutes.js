import { Router } from 'express';
import { AuthService } from '../services/authService.js';
import { ConversationalVoiceService, GREETINGS } from '../services/voice/conversationalVoiceService.js';

export const voiceRouter = Router();

// Middleware to extract user if authorization token is provided
function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    try {
      const decoded = AuthService.verifyToken(token);
      req.user = decoded;
    } catch {}
  }
  next();
}

/**
 * GET /api/voice/config
 * Returns supported languages, native greetings, and voice synthesizer configurations
 */
voiceRouter.get('/config', (req, res) => {
  const config = ConversationalVoiceService.getVoiceConfig();
  res.json(config);
});

/**
 * GET /api/voice/greeting/:language
 * Returns the natural initial greeting for the requested language (te, en, hi)
 */
voiceRouter.get('/greeting/:language', (req, res) => {
  const lang = req.params.language;
  const greeting = GREETINGS[lang] || GREETINGS.en;
  res.json({
    success: true,
    language: lang,
    greeting
  });
});

/**
 * POST /api/voice/chat
 * Natural context-aware conversational health assistant endpoint
 */
voiceRouter.post('/chat', optionalAuth, async (req, res, next) => {
  try {
    const { message, language, history, reportId } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_MESSAGE',
          message: 'Voice message text is required.'
        }
      });
    }

    const userId = req.user ? req.user.id : null;

    const result = await ConversationalVoiceService.processConversationTurn({
      userId,
      message,
      language,
      history: Array.isArray(history) ? history : [],
      reportId: reportId || null
    });

    return res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/voice/tts
 * Safe Text-To-Speech bridge: if cloud TTS credentials are configured, streams audio;
 * otherwise reports status and informs client to use browser natural speech synthesis.
 */
voiceRouter.post('/tts', async (req, res) => {
  try {
    const { text, language = 'en' } = req.body;
    const hasGcpCredentials = Boolean(
      process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.GCP_CREDENTIALS_JSON
    );

  if (!hasGcpCredentials) {
    return res.json({
      success: true,
      provider: 'browser-natural',
      isCloudTtsConfigured: false,
      message: 'Cloud TTS credentials unconfigured; client will synthesize with browser natural voice.'
    });
  }

    return res.json({
      success: true,
      provider: 'cloud-tts',
      isCloudTtsConfigured: true,
      message: 'Cloud TTS ready.'
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/voice/interview-step
 * Interactive guided post-upload questions (Confirm Date -> Hospital -> Doctor -> Context/Symptoms)
 */
voiceRouter.post('/interview-step', optionalAuth, async (req, res, next) => {
  try {
    const { step, answer, visitId, reportId, language } = req.body;
    const userId = req.user ? req.user.id : null;

    const result = await ConversationalVoiceService.processPostUploadInterviewStep({
      userId,
      visitId,
      reportId,
      step,
      answer,
      language: language || 'en'
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/voice/knowledge-base
 * Retrieves longitudinal patient profile, tracked biomarkers, past doctors, and hospitals
 */
voiceRouter.get('/knowledge-base', optionalAuth, async (req, res, next) => {
  try {
    const userId = req.user ? req.user.id : null;
    const { PatientKnowledgeService } = await import('../services/knowledge/patientKnowledgeService.js');
    const profile = PatientKnowledgeService.getPatientKnowledgeProfile(userId);
    res.json({ success: true, profile });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/voice/absorb-report
 * Absorbs newly uploaded medical report into patient knowledge base
 */
voiceRouter.post('/absorb-report', optionalAuth, async (req, res, next) => {
  try {
    const userId = req.user ? req.user.id : null;
    const { report, visit, hospitalName, physicianName, labResults } = req.body;
    const { PatientKnowledgeService } = await import('../services/knowledge/patientKnowledgeService.js');

    PatientKnowledgeService.absorbReportIntoKnowledge(userId, {
      report,
      visit,
      hospitalName,
      physicianName,
      labResults: labResults || []
    });

    res.json({ success: true, message: 'Report absorbed into patient knowledge base.' });
  } catch (err) {
    next(err);
  }
});

