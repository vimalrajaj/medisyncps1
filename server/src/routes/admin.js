import express from 'express';
import { supabase } from '../config/database.js';
import { authenticateToken } from './auth.js';
import { logger } from '../utils/logger.js';
import bcrypt from 'bcrypt';

const router = express.Router();

const AUDIT_ROLES = ['system_admin', 'compliance_officer', 'privacy_officer'];
const CONSENT_WRITE_ROLES = ['system_admin', 'compliance_officer', 'privacy_officer', 'clinical_admin'];

// Get system statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    // Check admin privileges
    if (req.authType !== 'user' || req.user.role !== 'system_admin') {
      return res.status(403).json({
        error: 'Admin privileges required'
      });
    }

    // Get terminology mapping stats
    const mappingStatsPromise = supabase
      .from('terminology_mappings')
      .select('status', { count: 'exact' });

    // Get API client stats
    const clientStatsPromise = supabase
      .from('api_clients')
      .select('is_active', { count: 'exact' });

    // Get recent activity stats
    const recentActivityPromise = supabase
      .from('api_usage_logs')
      .select('created_at')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    // Get user stats
    const userStatsPromise = supabase
      .from('user_profiles')
      .select('role, is_active', { count: 'exact' });

    const [mappingStats, clientStats, recentActivity, userStats] = await Promise.all([
      mappingStatsPromise,
      clientStatsPromise,
      recentActivityPromise,
      userStatsPromise
    ]);

    // Process mapping stats
    const mappingCounts = {};
    if (mappingStats.data) {
      mappingStats.data.forEach(item => {
        mappingCounts[item.status] = (mappingCounts[item.status] || 0) + 1;
      });
    }

    // Process client stats
    const activeClients = clientStats.data?.filter(c => c.is_active).length || 0;
    const totalClients = clientStats.count || 0;

    // Process user stats
    const roleCounts = {};
    const activeUsers = userStats.data?.filter(u => u.is_active).length || 0;
    if (userStats.data) {
      userStats.data.forEach(user => {
        roleCounts[user.role] = (roleCounts[user.role] || 0) + 1;
      });
    }

    res.json({
      terminology: {
        totalMappings: mappingStats.count || 0,
        byStatus: mappingCounts
      },
      apiClients: {
        total: totalClients,
        active: activeClients,
        inactive: totalClients - activeClients
      },
      users: {
        total: userStats.count || 0,
        active: activeUsers,
        byRole: roleCounts
      },
      activity: {
        last24Hours: recentActivity.data?.length || 0
      }
    });

  } catch (error) {
    logger.error('Failed to retrieve admin stats:', error);
    res.status(500).json({
      error: 'Failed to retrieve statistics',
      message: error.message
    });
  }
});

// Get system activity logs
router.get('/activity', authenticateToken, async (req, res) => {
  try {
    if (req.authType !== 'user' || req.user.role !== 'system_admin') {
      return res.status(403).json({
        error: 'Admin privileges required'
      });
    }

    const { page = 1, limit = 50, level } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('api_usage_logs')
      .select(`
        *,
        api_clients!inner(client_name, organization)
      `, { count: 'exact' })
      .order('created_at', { ascending: false });

    if (level && level !== 'all') {
      // Filter by log level if specified
      query = query.gte('status_code', level === 'error' ? 400 : 200)
                  .lt('status_code', level === 'error' ? 600 : 400);
    }

    const { data: logs, error, count } = await query
      .range(offset, offset + limit - 1);

    if (error) throw error;

    res.json({
      logs: logs || [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    logger.error('Failed to retrieve activity logs:', error);
    res.status(500).json({
      error: 'Failed to retrieve activity logs',
      message: error.message
    });
  }
});

// Manage API clients
router.get('/clients', authenticateToken, async (req, res) => {
  try {
    if (req.authType !== 'user' || req.user.role !== 'system_admin') {
      return res.status(403).json({
        error: 'Admin privileges required'
      });
    }

    const { page = 1, limit = 20, status } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('api_clients')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('is_active', status === 'active');
    }

    const { data: clients, error, count } = await query
      .range(offset, offset + limit - 1);

    if (error) throw error;

    // Remove sensitive data
    const sanitizedClients = clients?.map(client => ({
      ...client,
      client_secret_hash: undefined
    })) || [];

    res.json({
      clients: sanitizedClients,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    logger.error('Failed to retrieve API clients:', error);
    res.status(500).json({
      error: 'Failed to retrieve API clients',
      message: error.message
    });
  }
});

// Create API client
router.post('/clients', authenticateToken, async (req, res) => {
  try {
    if (req.authType !== 'user' || req.user.role !== 'system_admin') {
      return res.status(403).json({
        error: 'Admin privileges required'
      });
    }

    const { 
      client_name, 
      organization, 
      contact_email, 
      allowed_scopes,
      description 
    } = req.body;

    if (!client_name || !organization || !contact_email) {
      return res.status(400).json({
        error: 'client_name, organization, and contact_email are required'
      });
    }

    // Generate client credentials
    const client_id = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const client_secret = Math.random().toString(36).substr(2, 32);
    const client_secret_hash = await bcrypt.hash(client_secret, 10);

    const { data: newClient, error } = await supabase
      .from('api_clients')
      .insert({
        client_id,
        client_secret_hash,
        client_name,
        organization,
        contact_email,
        allowed_scopes: allowed_scopes || ['terminology:read'],
        description,
        is_active: true,
        created_by: req.user.id
      })
      .select()
      .single();

    if (error) throw error;

    logger.info(`New API client created: ${client_name} by ${req.user.full_name}`);

    res.status(201).json({
      message: 'API client created successfully',
      client: {
        ...newClient,
        client_secret_hash: undefined
      },
      credentials: {
        client_id,
        client_secret // Only returned once during creation
      }
    });

  } catch (error) {
    logger.error('Failed to create API client:', error);
    res.status(500).json({
      error: 'Failed to create API client',
      message: error.message
    });
  }
});

// Update API client
router.put('/clients/:clientId', authenticateToken, async (req, res) => {
  try {
    if (req.authType !== 'user' || req.user.role !== 'system_admin') {
      return res.status(403).json({
        error: 'Admin privileges required'
      });
    }

    const { clientId } = req.params;
    const updates = req.body;

    // Remove sensitive fields that shouldn't be updated this way
    delete updates.id;
    delete updates.client_id;
    delete updates.client_secret_hash;
    delete updates.created_at;
    delete updates.created_by;

    const { data: updatedClient, error } = await supabase
      .from('api_clients')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', clientId)
      .select()
      .single();

    if (error) throw error;

    if (!updatedClient) {
      return res.status(404).json({
        error: 'API client not found'
      });
    }

    logger.info(`API client updated: ${updatedClient.client_name} by ${req.user.full_name}`);

    res.json({
      message: 'API client updated successfully',
      client: {
        ...updatedClient,
        client_secret_hash: undefined
      }
    });

  } catch (error) {
    logger.error('Failed to update API client:', error);
    res.status(500).json({
      error: 'Failed to update API client',
      message: error.message
    });
  }
});

// Approve/reject terminology mapping
router.put('/mappings/:mappingId/status', authenticateToken, async (req, res) => {
  try {
    if (req.authType !== 'user' || !['system_admin', 'terminology_expert'].includes(req.user.role)) {
      return res.status(403).json({
        error: 'Insufficient privileges for mapping approval'
      });
    }

    const { mappingId } = req.params;
    const { status, notes } = req.body;

    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({
        error: 'Invalid status. Must be approved, rejected, or pending'
      });
    }

    const { data: mapping, error } = await supabase
      .from('terminology_mappings')
      .update({
        status,
        reviewer_notes: notes,
        reviewed_by: req.user.id,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', mappingId)
      .select()
      .single();

    if (error) throw error;

    if (!mapping) {
      return res.status(404).json({
        error: 'Terminology mapping not found'
      });
    }

    logger.info(`Mapping ${mappingId} ${status} by ${req.user.full_name}`);

    res.json({
      message: `Mapping ${status} successfully`,
      mapping
    });

  } catch (error) {
    logger.error('Failed to update mapping status:', error);
    res.status(500).json({
      error: 'Failed to update mapping status',
      message: error.message
    });
  }
});

// Get system health
router.get('/health', async (req, res) => {
  try {
    const healthChecks = {
      database: false,
      whoApi: false,
      timestamp: new Date().toISOString()
    };

    // Check database connectivity
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id')
        .limit(1);
      
      healthChecks.database = !error;
    } catch {
      healthChecks.database = false;
    }

    // Check WHO ICD API connectivity (skip auth for health check)
    try {
      const response = await fetch('https://id.who.int/icd/release/11/2022-02/mms/codeinfo/A00');
      healthChecks.whoApi = response.ok;
    } catch {
      healthChecks.whoApi = false;
    }

    const allHealthy = Object.values(healthChecks).every(check => 
      typeof check === 'boolean' ? check : true
    );

    res.status(allHealthy ? 200 : 503).json({
      status: allHealthy ? 'healthy' : 'degraded',
      checks: healthChecks
    });

  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

// GET /api/v1/admin/dashboard - Get dashboard statistics
router.get('/dashboard', async (req, res) => {
  try {
    // Get various statistics in parallel
    const [
      patientsResult,
      sessionsResult,
      clientsResult,
      usageResult,
      recentActivityResult
    ] = await Promise.all([
      // Total patients
      supabase
        .from('patients')
        .select('id', { count: 'exact' })
        .eq('is_active', true),
      
      // Total diagnosis sessions
      supabase
        .from('diagnosis_sessions')
        .select('id', { count: 'exact' }),
      
      // API clients by status
      supabase
        .from('api_clients')
        .select('status', { count: 'exact' })
        .eq('is_active', true),
      
      // API usage last 30 days
      supabase
        .from('api_usage')
        .select('id', { count: 'exact' })
        .gte('request_timestamp', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
      
      // Recent activity
      supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)
    ]);

    // Get API clients breakdown
    const { data: clientsByStatus } = await supabase
      .from('api_clients')
      .select('status')
      .eq('is_active', true);

    const clientStats = {
      total: clientsByStatus?.length || 0,
      active: clientsByStatus?.filter(c => c.status === 'active')?.length || 0,
      pending: clientsByStatus?.filter(c => c.status === 'pending')?.length || 0,
      suspended: clientsByStatus?.filter(c => c.status === 'suspended')?.length || 0
    };

    res.json({
      summary: {
        totalPatients: patientsResult.count || 0,
        totalSessions: sessionsResult.count || 0,
        totalClients: clientStats.total,
        monthlyApiCalls: usageResult.count || 0
      },
      clientStats,
      recentActivity: recentActivityResult.data || []
    });
  } catch (err) {
    logger.error('Dashboard statistics error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/v1/admin/audit-logs - Paginated activity logs with filters
router.get('/audit-logs', authenticateToken, async (req, res) => {
  try {
    if (req.authType !== 'user' || !AUDIT_ROLES.includes(req.user?.role)) {
      return res.status(403).json({ error: 'Audit privileges required' });
    }

    const {
      page = 1,
      limit = 25,
      activityType,
      status,
      search,
      startDate,
      endDate
    } = req.query;

    const pageNumber = Math.max(parseInt(page, 10) || 1, 1);
    const pageSize = Math.min(Math.max(parseInt(limit, 10) || 25, 1), 200);
    const rangeStart = (pageNumber - 1) * pageSize;
    const rangeEnd = rangeStart + pageSize - 1;

    let query = supabase
      .from('activity_logs')
      .select('*', { count: 'exact' });

    if (activityType && activityType !== 'all') {
      query = query.eq('activity_type', activityType);
    }

    if (status === 'success') {
      query = query.eq('success', true);
    } else if (status === 'failure') {
      query = query.eq('success', false);
    }

    if (startDate) {
      query = query.gte('created_at', new Date(startDate).toISOString());
    }

    if (endDate) {
      query = query.lte('created_at', new Date(endDate).toISOString());
    }

    if (search) {
      const sanitizedSearch = String(search).trim();
      if (sanitizedSearch) {
        const pattern = `%${sanitizedSearch.replace(/%/g, '\\%').replace(/_/g, '\\_')}%`;
        const orFilter = `activity_description.ilike.${pattern.replace(/,/g, '\\,')},user_name.ilike.${pattern.replace(/,/g, '\\,')},resource_id.ilike.${pattern.replace(/,/g, '\\,')}`;
        query = query.or(orFilter);
      }
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(rangeStart, rangeEnd);

    if (error) throw error;

    res.json({
      data: data || [],
      pagination: {
        page: pageNumber,
        limit: pageSize,
        total: count || 0,
        pages: count ? Math.ceil(count / pageSize) : 0
      }
    });
  } catch (error) {
    logger.error('Failed to retrieve audit logs:', error);
    res.status(500).json({
      error: 'Failed to retrieve audit logs',
      message: error.message
    });
  }
});

// GET /api/v1/admin/consent-records - Consent lifecycle overview
router.get('/consent-records', authenticateToken, async (req, res) => {
  try {
    if (req.authType !== 'user' || !AUDIT_ROLES.includes(req.user?.role)) {
      return res.status(403).json({ error: 'Consent review privileges required' });
    }

    const {
      page = 1,
      limit = 25,
      consentType,
      consentStatus,
      patientId,
      patientMrn,
      startDate,
      endDate
    } = req.query;

    const pageNumber = Math.max(parseInt(page, 10) || 1, 1);
    const pageSize = Math.min(Math.max(parseInt(limit, 10) || 25, 1), 200);
    const rangeStart = (pageNumber - 1) * pageSize;
    const rangeEnd = rangeStart + pageSize - 1;

    let resolvedPatientId = patientId;

    if (!resolvedPatientId && patientMrn) {
      const { data: patientLookup, error: patientError } = await supabase
        .from('patients')
        .select('id')
        .eq('medical_record_number', patientMrn)
        .maybeSingle();

      if (patientError) throw patientError;
      resolvedPatientId = patientLookup?.id || null;

      if (!resolvedPatientId) {
        return res.json({ data: [], pagination: { page: pageNumber, limit: pageSize, total: 0, pages: 0 } });
      }
    }

    let query = supabase
      .from('consent_records')
      .select(`
        *,
        patient:patients(id, medical_record_number, first_name, last_name)
      `, { count: 'exact' });

    if (consentType && consentType !== 'all') {
      query = query.eq('consent_type', consentType);
    }

    if (consentStatus && consentStatus !== 'all') {
      query = query.eq('consent_status', consentStatus);
    }

    if (resolvedPatientId) {
      query = query.eq('patient_id', resolvedPatientId);
    }

    if (startDate) {
      query = query.gte('recorded_at', new Date(startDate).toISOString());
    }

    if (endDate) {
      query = query.lte('recorded_at', new Date(endDate).toISOString());
    }

    const { data, error, count } = await query
      .order('recorded_at', { ascending: false })
      .range(rangeStart, rangeEnd);

    if (error) throw error;

    res.json({
      data: data || [],
      pagination: {
        page: pageNumber,
        limit: pageSize,
        total: count || 0,
        pages: count ? Math.ceil(count / pageSize) : 0
      }
    });
  } catch (error) {
    logger.error('Failed to retrieve consent records:', error);
    res.status(500).json({
      error: 'Failed to retrieve consent records',
      message: error.message
    });
  }
});

// POST /api/v1/admin/consent-records - Record or update consent lifecycle events
router.post('/consent-records', authenticateToken, async (req, res) => {
  try {
    if (req.authType !== 'user' || !CONSENT_WRITE_ROLES.includes(req.user?.role)) {
      return res.status(403).json({ error: 'Consent management privileges required' });
    }

    const {
      patientId,
      patientMrn,
      consentType,
      consentStatus,
      consentVersion,
      consentScope,
      evidenceUrl,
      effectiveFrom,
      effectiveUntil,
      metadata
    } = req.body;

    if (!consentType || !consentStatus) {
      return res.status(400).json({ error: 'consentType and consentStatus are required' });
    }

    let resolvedPatientId = patientId;

    if (!resolvedPatientId && patientMrn) {
      const { data: patientLookup, error: patientError } = await supabase
        .from('patients')
        .select('id')
        .eq('medical_record_number', patientMrn)
        .maybeSingle();

      if (patientError) throw patientError;

      if (!patientLookup) {
        return res.status(404).json({ error: 'Patient not found for provided MRN' });
      }

      resolvedPatientId = patientLookup.id;
    }

    const payload = {
      patient_id: resolvedPatientId || null,
      consent_type: consentType,
      consent_status: consentStatus,
      consent_version: consentVersion || null,
      consent_scope: consentScope || null,
      evidence_url: evidenceUrl || null,
      effective_from: effectiveFrom ? new Date(effectiveFrom).toISOString() : null,
      effective_until: effectiveUntil ? new Date(effectiveUntil).toISOString() : null,
      recorded_by: req.user?.full_name || req.user?.email || req.user?.id || 'Unknown User',
      recorded_by_role: req.user?.role || 'unknown',
      metadata: metadata || null
    };

    const { data, error } = await supabase
      .from('consent_records')
      .insert(payload)
      .select('*')
      .single();

    if (error) throw error;

    try {
      await supabase.from('activity_logs').insert({
        user_id: req.user?.id || null,
        user_name: payload.recorded_by,
        activity_type: 'consent',
        activity_description: `Consent ${consentStatus} for ${consentType}`,
        resource_type: 'consent_record',
        resource_id: data?.id,
        metadata: {
          consent_status: consentStatus,
          consent_type: consentType,
          consent_version: consentVersion || null,
          patient_id: resolvedPatientId || null
        }
      });
    } catch (activityError) {
      logger.warn('Consent recorded but failed to write audit log', activityError);
    }

    res.status(201).json({ data });
  } catch (error) {
    logger.error('Failed to record consent:', error);
    res.status(500).json({
      error: 'Failed to record consent',
      message: error.message
    });
  }
});

export default router;