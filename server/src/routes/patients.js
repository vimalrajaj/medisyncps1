import express from 'express';
import { supabase } from '../config/database.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// GET /api/v1/patients - List all patients
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('patients')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,medical_record_number.ilike.%${search}%`);
    }

    const { data: patients, error, count } = await query
      .range(offset, offset + limit - 1)
      .limit(limit);

    if (error) {
      logger.error('Error fetching patients:', error);
      return res.status(500).json({ error: 'Failed to fetch patients' });
    }

    res.json({
      patients,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (err) {
    logger.error('Patients list error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/v1/patients/:id - Get patient by ID
router.get('/:id', async (req, res) => {
  try {
    const { data: patient, error } = await supabase
      .from('patients')
      .select('*')
      .eq('id', req.params.id)
      .eq('is_active', true)
      .single();

    if (error) {
      logger.error('Error fetching patient:', error);
      return res.status(404).json({ error: 'Patient not found' });
    }

    res.json({ patient });
  } catch (err) {
    logger.error('Patient fetch error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/v1/patients - Create new patient
router.post('/', async (req, res) => {
  try {
    const {
      medical_record_number,
      first_name,
      last_name,
      date_of_birth,
      gender,
      phone,
      email,
      address,
      emergency_contact
    } = req.body;

    // Validate required fields
    if (!medical_record_number || !first_name || !last_name) {
      return res.status(400).json({ 
        error: 'Missing required fields: medical_record_number, first_name, last_name' 
      });
    }

    const { data: patient, error } = await supabase
      .from('patients')
      .insert({
        medical_record_number,
        first_name,
        last_name,
        date_of_birth,
        gender,
        phone,
        email,
        address,
        emergency_contact
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        return res.status(409).json({ error: 'Medical record number already exists' });
      }
      logger.error('Error creating patient:', error);
      return res.status(500).json({ error: 'Failed to create patient' });
    }

    // Log activity
    await supabase.from('activity_logs').insert({
      activity_type: 'patient_created',
      activity_description: `New patient created: ${first_name} ${last_name}`,
      resource_type: 'patient',
      resource_id: patient.id,
      metadata: { medical_record_number }
    });

    res.status(201).json({ patient });
  } catch (err) {
    logger.error('Patient creation error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/v1/patients/:id - Update patient
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body, updated_at: new Date().toISOString() };
    delete updateData.id; // Don't allow ID updates

    const { data: patient, error } = await supabase
      .from('patients')
      .update(updateData)
      .eq('id', id)
      .eq('is_active', true)
      .select()
      .single();

    if (error) {
      logger.error('Error updating patient:', error);
      return res.status(500).json({ error: 'Failed to update patient' });
    }

    // Log activity
    await supabase.from('activity_logs').insert({
      activity_type: 'patient_updated',
      activity_description: `Patient updated: ${patient.first_name} ${patient.last_name}`,
      resource_type: 'patient',
      resource_id: patient.id
    });

    res.json({ patient });
  } catch (err) {
    logger.error('Patient update error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/v1/patients/:id/history - Get patient diagnosis history
router.get('/:id/history', async (req, res) => {
  try {
    const { data: sessions, error } = await supabase
      .from('diagnosis_sessions')
      .select(`
        *,
        diagnosis_entries (
          id,
          namaste_code,
          namaste_display,
          icd11_code,
          icd11_display,
          confidence_score,
          mapping_source,
          clinical_notes,
          created_at
        )
      `)
      .eq('patient_id', req.params.id)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error fetching patient history:', error);
      // Return empty sessions instead of error for now
      return res.json({ sessions: [] });
    }

    res.json({ sessions: sessions || [] });
  } catch (err) {
    logger.error('Patient history error:', err);
    // Return empty sessions instead of error for now
    res.json({ sessions: [] });
  }
});

// DELETE /api/v1/patients/:id - Soft delete patient
router.delete('/:id', async (req, res) => {
  try {
    const { data: patient, error } = await supabase
      .from('patients')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) {
      logger.error('Error deleting patient:', error);
      return res.status(500).json({ error: 'Failed to delete patient' });
    }

    // Log activity
    await supabase.from('activity_logs').insert({
      activity_type: 'patient_deleted',
      activity_description: `Patient deactivated: ${patient.first_name} ${patient.last_name}`,
      resource_type: 'patient',
      resource_id: patient.id
    });

    res.json({ message: 'Patient deactivated successfully' });
  } catch (err) {
    logger.error('Patient deletion error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;