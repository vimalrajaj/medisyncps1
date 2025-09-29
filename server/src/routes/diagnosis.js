import express from 'express';
import { supabase } from '../config/database.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// GET /api/v1/diagnosis-sessions - List diagnosis sessions
router.get('/', async (req, res) => {
  try {
    const { patient_id, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('diagnosis_sessions')
      .select(`
        *,
        patients (
          id,
          medical_record_number,
          first_name,
          last_name
        ),
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
      .order('created_at', { ascending: false });

    if (patient_id) {
      query = query.eq('patient_id', patient_id);
    }

    const { data: sessions, error, count } = await query
      .range(offset, offset + limit - 1)
      .limit(limit);

    if (error) {
      logger.error('Error fetching diagnosis sessions:', error);
      return res.status(500).json({ error: 'Failed to fetch diagnosis sessions' });
    }

    res.json({
      sessions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (err) {
    logger.error('Diagnosis sessions list error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/v1/diagnosis-sessions/:id - Get specific diagnosis session
router.get('/:id', async (req, res) => {
  try {
    const { data: session, error } = await supabase
      .from('diagnosis_sessions')
      .select(`
        *,
        patients (
          id,
          medical_record_number,
          first_name,
          last_name,
          date_of_birth,
          gender
        ),
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
      .eq('id', req.params.id)
      .single();

    if (error) {
      logger.error('Error fetching diagnosis session:', error);
      return res.status(404).json({ error: 'Diagnosis session not found' });
    }

    res.json({ session });
  } catch (err) {
    logger.error('Diagnosis session fetch error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/v1/diagnosis-sessions - Create new diagnosis session
router.post('/', async (req, res) => {
  try {
    const {
      patient_id: inputPatientId,
      medical_record_number,
      first_name,
      last_name,
      session_title,
      chief_complaint,
      clinical_notes,
      clinician_name,
      clinician_id,
      diagnosis_entries,
      fhir_bundle
    } = req.body;

    // Validate required fields
    if (!medical_record_number || !session_title) {
      return res.status(400).json({ 
        error: 'Missing required fields: medical_record_number, session_title' 
      });
    }

    let patientId;

    // Lookup or create patient by medical_record_number
    if (medical_record_number) {
      let { data: existingPatient, error: lookupError } = await supabase
        .from('patients')
        .select('id')
        .eq('medical_record_number', medical_record_number)
        .eq('is_active', true)
        .single();

      if (lookupError && lookupError.code !== 'PGRST116') { // PGRST116 = no rows
        logger.error('Error looking up patient:', lookupError);
        return res.status(500).json({ error: 'Failed to lookup patient' });
      }

      if (!existingPatient) {
        // Create new patient
        const { data: newPatient, error: createError } = await supabase
          .from('patients')
          .insert({
            medical_record_number,
            first_name: first_name || 'Unknown',
            last_name: last_name || 'Patient',
            is_active: true
          })
          .select()
          .single();

        if (createError) {
          logger.error('Error creating patient:', createError);
          return res.status(500).json({ error: 'Failed to create patient' });
        }

        patientId = newPatient.id;
        logger.info(`Created new patient with MRN: ${medical_record_number}, ID: ${patientId}`);
      } else {
        patientId = existingPatient.id;
        logger.info(`Found existing patient with MRN: ${medical_record_number}, ID: ${patientId}`);
      }
    } else {
      return res.status(400).json({ error: 'Medical record number is required' });
    }

    // Calculate session statistics
    const total_codes = diagnosis_entries ? diagnosis_entries.length : 0;
    const confidence_score = diagnosis_entries && diagnosis_entries.length > 0
      ? diagnosis_entries.reduce((sum, entry) => sum + (entry.confidence_score || 0), 0) / diagnosis_entries.length
      : 0;

    // Create diagnosis session
    const { data: session, error: sessionError } = await supabase
      .from('diagnosis_sessions')
      .insert({
        patient_id: patientId,
        session_title,
        chief_complaint,
        clinical_notes,
        clinician_name,
        clinician_id,
        total_codes,
        confidence_score,
        fhir_bundle
      })
      .select()
      .single();

    if (sessionError) {
      logger.error('Error creating diagnosis session:', sessionError);
      return res.status(500).json({ error: 'Failed to create diagnosis session' });
    }

    // Create diagnosis entries if provided
    let entries = [];
    if (diagnosis_entries && diagnosis_entries.length > 0) {
      const entriesData = diagnosis_entries.map(entry => ({
        session_id: session.id,
        namaste_code: entry.namaste_code,
        namaste_display: entry.namaste_display,
        icd11_code: entry.icd11_code,
        icd11_display: entry.icd11_display,
        confidence_score: entry.confidence_score,
        mapping_source: entry.mapping_source,
        clinical_notes: entry.clinical_notes
      }));

      const { data: createdEntries, error: entriesError } = await supabase
        .from('diagnosis_entries')
        .insert(entriesData)
        .select();

      if (entriesError) {
        logger.error('Error creating diagnosis entries:', entriesError);
        // Continue anyway, session was created successfully
      } else {
        entries = createdEntries;
      }
    }

    // Log activity
    await supabase.from('activity_logs').insert({
      activity_type: 'diagnosis_created',
      activity_description: `New diagnosis session created: ${session_title}`,
      resource_type: 'diagnosis_session',
      resource_id: session.id,
      metadata: { 
        patient_id: patientId, 
        total_codes, 
        confidence_score: Math.round(confidence_score * 100) / 100 
      }
    });

    res.status(201).json({ 
      session: {
        ...session,
        diagnosis_entries: entries
      }
    });
  } catch (err) {
    logger.error('Diagnosis session creation error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/v1/diagnosis-sessions/:id - Update diagnosis session
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { 
      ...req.body, 
      updated_at: new Date().toISOString() 
    };
    delete updateData.id;
    delete updateData.diagnosis_entries; // Handle entries separately

    const { data: session, error } = await supabase
      .from('diagnosis_sessions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error('Error updating diagnosis session:', error);
      return res.status(500).json({ error: 'Failed to update diagnosis session' });
    }

    // Log activity
    await supabase.from('activity_logs').insert({
      activity_type: 'diagnosis_updated',
      activity_description: `Diagnosis session updated: ${session.session_title}`,
      resource_type: 'diagnosis_session',
      resource_id: session.id
    });

    res.json({ session });
  } catch (err) {
    logger.error('Diagnosis session update error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/v1/diagnosis-sessions/:id/entries - Add diagnosis entry to session
router.post('/:id/entries', async (req, res) => {
  try {
    const session_id = req.params.id;
    const {
      namaste_code,
      namaste_display,
      icd11_code,
      icd11_display,
      confidence_score,
      mapping_source,
      clinical_notes
    } = req.body;

    const { data: entry, error } = await supabase
      .from('diagnosis_entries')
      .insert({
        session_id,
        namaste_code,
        namaste_display,
        icd11_code,
        icd11_display,
        confidence_score,
        mapping_source,
        clinical_notes
      })
      .select()
      .single();

    if (error) {
      logger.error('Error creating diagnosis entry:', error);
      return res.status(500).json({ error: 'Failed to create diagnosis entry' });
    }

    // Update session statistics
    const { data: allEntries } = await supabase
      .from('diagnosis_entries')
      .select('confidence_score')
      .eq('session_id', session_id);

    const total_codes = allEntries.length;
    const avg_confidence = allEntries.reduce((sum, e) => sum + (e.confidence_score || 0), 0) / total_codes;

    await supabase
      .from('diagnosis_sessions')
      .update({ 
        total_codes,
        confidence_score: avg_confidence,
        updated_at: new Date().toISOString()
      })
      .eq('id', session_id);

    res.status(201).json({ entry });
  } catch (err) {
    logger.error('Diagnosis entry creation error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/v1/diagnosis-sessions/:id - Delete diagnosis session
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('diagnosis_sessions')
      .delete()
      .eq('id', req.params.id);

    if (error) {
      logger.error('Error deleting diagnosis session:', error);
      return res.status(500).json({ error: 'Failed to delete diagnosis session' });
    }

    // Log activity
    await supabase.from('activity_logs').insert({
      activity_type: 'diagnosis_deleted',
      activity_description: `Diagnosis session deleted`,
      resource_type: 'diagnosis_session',
      resource_id: req.params.id
    });

    res.json({ message: 'Diagnosis session deleted successfully' });
  } catch (err) {
    logger.error('Diagnosis session deletion error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;