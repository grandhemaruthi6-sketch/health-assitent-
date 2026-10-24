import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { MedicalRecordService } from '../services/medicalRecordService.js';

export const hospitalRouter = Router();

// All hospital routes require authentication
hospitalRouter.use(requireAuth);

/**
 * GET /api/hospitals
 * Retrieve all registered hospitals for the authenticated user
 */
hospitalRouter.get('/', (req, res, next) => {
  try {
    const hospitals = MedicalRecordService.getUserHospitals(req.user.id);
    res.json({
      success: true,
      data: hospitals
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/hospitals
 * Create or select a hospital for the authenticated user
 */
hospitalRouter.post('/', (req, res, next) => {
  try {
    const { name, branch, location, department } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Hospital name is required.'
        }
      });
    }

    const hospital = MedicalRecordService.createOrSelectHospital(req.user.id, {
      name,
      branch,
      location,
      department
    });

    res.status(201).json({
      success: true,
      data: hospital
    });
  } catch (err) {
    next(err);
  }
});
