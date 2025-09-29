import express from 'express';
import * as fhirService from '../services/fhirService.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

/**
 * Process a FHIR bundle
 * POST /api/v1/fhir
 */
router.post('/', async (req, res) => {
  try {
    // Validate the incoming request body is a FHIR bundle
    const bundle = req.body;
    
    if (!bundle || !bundle.resourceType || bundle.resourceType !== 'Bundle') {
      return res.status(400).json({
        error: 'Invalid FHIR bundle: must have resourceType "Bundle"'
      });
    }
    
    // Process the bundle
    const result = await fhirService.processBundle(bundle);
    
    // Return the result
    res.status(201).json({
      message: 'FHIR bundle processed successfully',
      bundleId: bundle.id,
      result
    });
  } catch (error) {
    logger.error(`FHIR bundle processing error: ${error.message}`);
    res.status(500).json({
      error: 'Failed to process FHIR bundle',
      details: error.message
    });
  }
});

/**
 * Get patient history by patient ID
 * GET /api/v1/fhir/patient/:id/history
 */
router.get('/patient/:id/history', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        error: 'Patient ID is required'
      });
    }
    
    const history = await fhirService.getPatientHistory(id);
    
    res.json({
      patientId: id,
      history
    });
  } catch (error) {
    logger.error(`Error fetching patient history: ${error.message}`);
    res.status(500).json({
      error: 'Failed to fetch patient history',
      details: error.message
    });
  }
});

export default router;