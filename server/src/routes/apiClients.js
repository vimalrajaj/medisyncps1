import express from 'express';
import crypto from 'crypto';
import { supabase } from '../config/database.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// Helper function to generate API key
function generateApiKey() {
  const key = crypto.randomBytes(32).toString('hex');
  const prefix = 'aysh_' + crypto.randomBytes(4).toString('hex');
  return { key: `${prefix}_${key}`, prefix };
}

// Helper function to hash API key
function hashApiKey(key) {
  return crypto.createHash('sha256').update(key).digest('hex');
}

// Cached schema detection state (5 min TTL)
let clientSchemaInfo = {
  checkedAt: 0,
  hasExtendedSchema: null,
  warned: false
};

async function hasExtendedClientSchema() {
  const now = Date.now();
  if (clientSchemaInfo.hasExtendedSchema !== null && now - clientSchemaInfo.checkedAt < 5 * 60 * 1000) {
    return clientSchemaInfo.hasExtendedSchema;
  }

  const { error } = await supabase
    .from('api_clients')
    .select('client_type')
    .limit(1);

  const hasExtended = !error;

  if (error && !clientSchemaInfo.warned) {
    logger.warn(
      'api_clients table is missing extended columns (client_type, contact_phone, expected_volume). Falling back to legacy schema support. Details: %s',
      error.message
    );
    clientSchemaInfo.warned = true;
  }

  clientSchemaInfo = {
    checkedAt: now,
    hasExtendedSchema: hasExtended,
    warned: clientSchemaInfo.warned
  };

  return hasExtended;
}

function computeRateLimits(clientType, expectedVolume) {
  const fallback = {
    perMinute: 60,
    perDay: 10000
  };

  const typeOverrides = {
    healthcare: { perMinute: 120, perDay: 50000 },
    research: { perMinute: 100, perDay: 25000 },
    integration: { perMinute: 80, perDay: 15000 },
    personal: { perMinute: 40, perDay: 5000 }
  };

  const volumeOverrides = {
    low: { perMinute: 60, perDay: 5000 },
    medium: { perMinute: 80, perDay: 15000 },
    high: { perMinute: 120, perDay: 50000 },
    enterprise: { perMinute: 200, perDay: 100000 }
  };

  const rates = { ...fallback, ...(typeOverrides[clientType] || {}) };

  if (expectedVolume && volumeOverrides[expectedVolume]) {
    rates.perMinute = Math.max(rates.perMinute, volumeOverrides[expectedVolume].perMinute);
    rates.perDay = Math.max(rates.perDay, volumeOverrides[expectedVolume].perDay);
  }

  return rates;
}

function normalizeExpectedVolume(expectedVolume) {
  if (typeof expectedVolume === 'number' && Number.isFinite(expectedVolume)) {
    return expectedVolume;
  }

  if (typeof expectedVolume === 'string') {
    const normalized = expectedVolume.toLowerCase();
    const volumeMap = {
      low: 5000,
      medium: 15000,
      high: 50000,
      enterprise: 100000
    };
    if (volumeMap[normalized]) {
      return volumeMap[normalized];
    }

    const parsed = Number.parseInt(expectedVolume, 10);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }

  return null;
}

function normalizeClientRecord(record, hasExtendedSchema) {
  if (hasExtendedSchema) {
    return {
      ...record,
      expected_volume: typeof record.expected_volume === 'number' ? record.expected_volume : record.expected_volume || null,
      rate_limit_per_minute: record.rate_limit_per_minute ?? 60,
      rate_limit_per_day: record.rate_limit_per_day ?? 10000,
      client_type: record.client_type || 'integration',
      legacy_schema: false
    };
  }

  const fallbackRates = computeRateLimits('integration');
  const perDay = record.rate_limit ?? fallbackRates.perDay;
  const perMinute = Math.max(30, Math.round(perDay / (24 * 60)));

  // Map legacy enum status values to our standard statuses
  let normalizedStatus = record.status;
  if (record.status === 'active') normalizedStatus = 'active';
  if (record.status === 'inactive') normalizedStatus = 'pending';
  if (record.status === 'suspended') normalizedStatus = 'suspended';
  
  return {
    id: record.id,
    client_name: record.client_name,
    client_type: 'integration',
    organization: record.organization,
    contact_email: record.contact_email,
    status: normalizedStatus || 'pending',
    created_at: record.created_at,
    approved_at: record.updated_at || null,
    expected_volume: perDay,
    rate_limit_per_minute: perMinute,
    rate_limit_per_day: perDay,
    legacy_client_key: record.client_key || null,
    legacy_rate_limit: record.rate_limit ?? null,
    legacy_schema: true
  };
}

// GET /api/v1/api-clients - List API clients
router.get('/', async (req, res) => {
  try {
    const { status, client_type, page = 1, limit = 10 } = req.query;

    const pageNumber = Number.parseInt(page, 10);
    const limitNumber = Number.parseInt(limit, 10);

    const safePage = Number.isFinite(pageNumber) && pageNumber > 0 ? pageNumber : 1;
    const safeLimit = Number.isFinite(limitNumber) && limitNumber > 0 ? limitNumber : 10;
    const offsetValue = (safePage - 1) * safeLimit;

    const hasExtendedSchema = await hasExtendedClientSchema();

    // First, let's try a simple query to debug
    let query = supabase
      .from('api_clients')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offsetValue, offsetValue + safeLimit - 1);

    if (status) query = query.eq('status', status);

    if (client_type && hasExtendedSchema) {
      query = query.eq('client_type', client_type);
    }

    const { data: clients, error, count } = await query;

    if (error) {
      logger.error('Error fetching API clients:', error);
      console.error('Detailed error:', error);
      return res.status(500).json({ 
        error: 'Failed to fetch API clients',
        details: error.message 
      });
    }

    const normalizedClients = (clients || []).map((record) => normalizeClientRecord(record, hasExtendedSchema));

    const totalRecords = typeof count === 'number' ? count : normalizedClients.length;

    res.json({
      clients: normalizedClients,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total: totalRecords,
        totalPages: safeLimit > 0 ? Math.max(1, Math.ceil(totalRecords / safeLimit)) : 1
      },
      schema: {
        extended: hasExtendedSchema
      }
    });
  } catch (err) {
    logger.error('API clients list error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/v1/api-clients/:id - Get specific API client
router.get('/:id', async (req, res) => {
  try {
    const { data: client, error } = await supabase
      .from('api_clients')
      .select(`
        *,
        api_keys (
          id,
          key_name,
          key_prefix,
          scopes,
          last_used_at,
          expires_at,
          is_active,
          created_at
        )
      `)
      .eq('id', req.params.id)
      .eq('is_active', true)
      .single();

    if (error) {
      logger.error('Error fetching API client:', error);
      return res.status(404).json({ error: 'API client not found' });
    }

    res.json({ client });
  } catch (err) {
    logger.error('API client fetch error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/v1/api-clients - Register new API client
router.post('/', async (req, res) => {
  try {
    const {
      client_name,
      client_type,
      organization,
      contact_email,
      contact_phone,
      description,
      website_url,
      expected_volume,
      primary_contact,
      address,
      intended_usage,
      fhir_compliance,
      terms_accepted
    } = req.body;

    // Validate required fields
    if (!client_name || !contact_email) {
      return res.status(400).json({ 
        error: 'Missing required fields: client_name and contact_email are mandatory' 
      });
    }

    // Check for extended schema
    const hasExtendedSchema = await hasExtendedClientSchema();
    
    const normalizedClientType = client_type || 'integration';
    const normalizedVolumeValue = normalizeExpectedVolume(expected_volume);
    const rateLimits = computeRateLimits(normalizedClientType, expected_volume);

    // Create appropriate payload based on schema
    let insertPayload;
    let selectColumns;
    
    if (hasExtendedSchema) {
      // Extended schema with all new fields
      insertPayload = {
        client_name,
        organization,
        contact_email,
        status: 'pending',
        client_type: normalizedClientType,
        contact_phone,
        description: description || intended_usage,
        website_url,
        expected_volume: normalizedVolumeValue || rateLimits.perDay,
        rate_limit_per_minute: rateLimits.perMinute,
        rate_limit_per_day: rateLimits.perDay
      };
      selectColumns = '*';
    } else {
      // Legacy schema with limited fields
      // Generate a client key for legacy schema
      const clientKey = crypto.randomBytes(16).toString('hex');
      
      insertPayload = {
        client_name,
        organization,
        contact_email,
        client_key: clientKey,
        status: 'active', // Using enum value from schema
        rate_limit: rateLimits.perDay
        // Note: created_by is UUID and would need a valid UUID, skipping for now
      };
      selectColumns = 'id, client_name, organization, contact_email, status, created_at, updated_at, rate_limit, client_key';
    }

    console.log('Using schema:', hasExtendedSchema ? 'extended' : 'legacy');
    console.log('Insert payload:', JSON.stringify(insertPayload));

    const { data: client, error } = await supabase
      .from('api_clients')
      .insert(insertPayload)
      .select(selectColumns)
      .single();

    if (error) {
      logger.error('Error creating API client:', error);
      console.error('Detailed error:', error);
      return res.status(500).json({ 
        error: 'Failed to create API client',
        details: error.message 
      });
    }

    // Try to log activity (non-blocking)
    try {
      await supabase.from('activity_logs').insert({
        activity_type: 'api_client_registered',
        activity_description: `New API client registered: ${client_name}`,
        resource_type: 'api_client',
        resource_id: client.id,
        metadata: {
          client_type: normalizedClientType,
          organization,
          contact_email,
          contact_phone,
          primary_contact,
          address,
          expected_volume_label: expected_volume || null,
          expected_volume_normalized: normalizedVolumeValue || rateLimits.perDay,
          intended_usage,
          fhir_compliance: !!fhir_compliance,
          terms_accepted: !!terms_accepted
        }
      });
    } catch (activityError) {
      logger.warn('Failed to log activity:', activityError.message);
    }

    // Try to create notification (non-blocking)
    try {
      await supabase.from('notifications').insert({
        recipient_type: 'admin',
        title: 'New API Client Registration',
        message: `${client_name} from ${organization || 'Unknown'} has requested API access`,
        notification_type: 'info',
        category: 'api',
        metadata: { client_id: client.id, client_type: normalizedClientType }
      });
    } catch (notificationError) {
      logger.warn('Failed to create notification:', notificationError.message);
    }

    res.status(201).json({ client: normalizeClientRecord(client, hasExtendedSchema) });
  } catch (err) {
    logger.error('API client creation error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/v1/api-clients/:id/approve - Approve API client
router.put('/:id/approve', async (req, res) => {
  try {
    const { approved_by } = req.body;

    const hasExtendedSchema = await hasExtendedClientSchema();

    const updatePayload = {
      status: 'active'
    };

    if (hasExtendedSchema) {
      updatePayload.approved_at = new Date().toISOString();
      updatePayload.approved_by = approved_by || 'System Admin';
    }

    const selectColumns = hasExtendedSchema
      ? '*'
      : 'id, client_name, organization, contact_email, status, created_at, updated_at, rate_limit, client_key';

    const { data: client, error } = await supabase
      .from('api_clients')
      .update(updatePayload)
      .eq('id', req.params.id)
      .select(selectColumns)
      .single();

    if (error) {
      logger.error('Error approving API client:', error);
      return res.status(500).json({ error: 'Failed to approve API client' });
    }

    // Try to log activity (non-blocking)
    try {
      await supabase.from('activity_logs').insert({
        activity_type: 'api_client_approved',
        activity_description: `API client approved: ${client.client_name}`,
        resource_type: 'api_client',
        resource_id: client.id,
        metadata: { approved_by }
      });
    } catch (activityError) {
      logger.warn('Failed to log approval activity:', activityError.message);
    }

    res.json({ client: normalizeClientRecord(client, hasExtendedSchema) });
  } catch (err) {
    logger.error('API client approval error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/v1/api-clients/:id/keys - Generate new API key
router.post('/:id/keys', async (req, res) => {
  try {
    const client_id = req.params.id;
    const { key_name, scopes, expires_in_days } = req.body;

    if (!key_name) {
      return res.status(400).json({ error: 'key_name is required' });
    }

    // Check if client exists and is active
    const { data: client, error: clientError } = await supabase
      .from('api_clients')
      .select('id, client_name, status')
      .eq('id', client_id)
      .eq('status', 'active')
      .single();

    if (clientError || !client) {
      return res.status(404).json({ error: 'Active API client not found' });
    }

    // Generate API key
    const { key, prefix } = generateApiKey();
    const hashedKey = hashApiKey(key);

    const expires_at = expires_in_days 
      ? new Date(Date.now() + expires_in_days * 24 * 60 * 60 * 1000).toISOString()
      : null;

    const { data: apiKey, error } = await supabase
      .from('api_keys')
      .insert({
        client_id,
        key_name,
        api_key: hashedKey,
        key_prefix: prefix,
        scopes: scopes || ['terminology:read'],
        expires_at
      })
      .select('id, key_name, key_prefix, scopes, expires_at, created_at')
      .single();

    if (error) {
      logger.error('Error creating API key:', error);
      return res.status(500).json({ error: 'Failed to create API key' });
    }

    // Log activity
    await supabase.from('activity_logs').insert({
      activity_type: 'api_key_generated',
      activity_description: `New API key generated for client: ${client.client_name}`,
      resource_type: 'api_key',
      resource_id: apiKey.id,
      metadata: { client_id, key_name, scopes }
    });

    // Return the actual key only once (for copying)
    res.status(201).json({ 
      api_key: key,
      key_info: apiKey,
      message: 'API key generated successfully. Save this key as it will not be shown again.'
    });
  } catch (err) {
    logger.error('API key generation error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/v1/api-clients/:id/usage - Get usage statistics
router.get('/:id/usage', async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const { data: usage, error } = await supabase
      .from('api_usage')
      .select('*')
      .eq('client_id', req.params.id)
      .gte('request_timestamp', startDate)
      .order('request_timestamp', { ascending: false });

    if (error) {
      logger.error('Error fetching usage data:', error);
      return res.status(500).json({ error: 'Failed to fetch usage data' });
    }

    // Calculate statistics
    const totalRequests = usage.length;
    const successfulRequests = usage.filter(u => u.response_status < 400).length;
    const errorRequests = usage.filter(u => u.response_status >= 400).length;
    const avgResponseTime = usage.length > 0 
      ? usage.reduce((sum, u) => sum + (u.response_time_ms || 0), 0) / usage.length 
      : 0;

    // Group by day
    const dailyStats = {};
    usage.forEach(u => {
      const day = u.request_timestamp.split('T')[0];
      if (!dailyStats[day]) {
        dailyStats[day] = { requests: 0, errors: 0 };
      }
      dailyStats[day].requests++;
      if (u.response_status >= 400) {
        dailyStats[day].errors++;
      }
    });

    res.json({
      summary: {
        totalRequests,
        successfulRequests,
        errorRequests,
        successRate: totalRequests > 0 ? (successfulRequests / totalRequests * 100) : 0,
        avgResponseTime: Math.round(avgResponseTime)
      },
      dailyStats,
      recentRequests: usage.slice(0, 10)
    });
  } catch (err) {
    logger.error('Usage statistics error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/v1/api-clients/:id/keys/:keyId - Revoke API key
router.delete('/:id/keys/:keyId', async (req, res) => {
  try {
    const { error } = await supabase
      .from('api_keys')
      .update({ is_active: false })
      .eq('id', req.params.keyId)
      .eq('client_id', req.params.id);

    if (error) {
      logger.error('Error revoking API key:', error);
      return res.status(500).json({ error: 'Failed to revoke API key' });
    }

    // Log activity
    await supabase.from('activity_logs').insert({
      activity_type: 'api_key_revoked',
      activity_description: `API key revoked`,
      resource_type: 'api_key',
      resource_id: req.params.keyId,
      metadata: { client_id: req.params.id }
    });

    res.json({ message: 'API key revoked successfully' });
  } catch (err) {
    logger.error('API key revocation error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;