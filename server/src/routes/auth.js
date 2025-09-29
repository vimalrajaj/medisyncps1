import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { supabase } from '../config/database.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// Generate JWT token
const generateToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
};

// Mock ABHA authentication
router.post('/abha/login', async (req, res) => {
  try {
    const { abhaAddress, password } = req.body;

    if (!abhaAddress || !password) {
      return res.status(400).json({
        error: 'ABHA address and password are required'
      });
    }

    // Mock ABHA validation - in real implementation, this would call ABHA APIs
    const mockCredentials = {
      'doctor.ayush@abha': { 
        password: 'doctor123', 
        role: 'clinical_user',
        name: 'Dr. Ayush Sharma',
        organization: 'AIIMS Delhi'
      },
      'admin.namaste@abha': { 
        password: 'admin123', 
        role: 'system_admin',
        name: 'NAMASTE Admin',
        organization: 'Ministry of AYUSH'
      },
      'developer.test@abha': { 
        password: 'dev123', 
        role: 'api_developer',
        name: 'API Developer',
        organization: 'Healthcare IT Solutions'
      }
    };

    const mockUser = mockCredentials[abhaAddress];
    if (!mockUser || mockUser.password !== password) {
      return res.status(401).json({
        error: 'Invalid ABHA credentials'
      });
    }

    // Check if user exists in our system
    let { data: userProfile, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('abha_address', abhaAddress)
      .single();

    if (error && error.code === 'PGRST116') {
      // User doesn't exist, create profile
      const { data: newUser, error: createError } = await supabase
        .from('user_profiles')
        .insert({
          abha_address: abhaAddress,
          full_name: mockUser.name,
          organization: mockUser.organization,
          role: mockUser.role,
          is_active: true
        })
        .select()
        .single();

      if (createError) throw createError;
      userProfile = newUser;
    } else if (error) {
      throw error;
    }

    // Generate JWT token
    const token = generateToken(userProfile.id, userProfile.role);

    // Update last login
    await supabase
      .from('user_profiles')
      .update({ 
        last_login: new Date().toISOString(),
        is_active: true
      })
      .eq('id', userProfile.id);

    logger.info(`User ${abhaAddress} logged in successfully`);

    res.json({
      message: 'Login successful',
      user: {
        id: userProfile.id,
        abhaAddress: userProfile.abha_address,
        name: userProfile.full_name,
        organization: userProfile.organization,
        role: userProfile.role
      },
      token,
      expiresIn: process.env.JWT_EXPIRES_IN || '24h'
    });

  } catch (error) {
    logger.error('ABHA login failed:', error);
    res.status(500).json({
      error: 'Authentication failed',
      message: error.message
    });
  }
});

// OAuth 2.0 client credentials flow (for API clients)
router.post('/oauth/token', async (req, res) => {
  try {
    const { grant_type, client_id, client_secret } = req.body;

    if (grant_type !== 'client_credentials') {
      return res.status(400).json({
        error: 'unsupported_grant_type',
        error_description: 'Only client_credentials grant type is supported'
      });
    }

    if (!client_id || !client_secret) {
      return res.status(400).json({
        error: 'invalid_request',
        error_description: 'client_id and client_secret are required'
      });
    }

    // Validate API client
    const { data: apiClient, error } = await supabase
      .from('api_clients')
      .select('*')
      .eq('client_id', client_id)
      .eq('is_active', true)
      .single();

    if (error || !apiClient) {
      return res.status(401).json({
        error: 'invalid_client',
        error_description: 'Invalid client credentials'
      });
    }

    // Verify client secret
    const secretValid = await bcrypt.compare(client_secret, apiClient.client_secret_hash);
    if (!secretValid) {
      return res.status(401).json({
        error: 'invalid_client',
        error_description: 'Invalid client credentials'
      });
    }

    // Generate access token
    const accessToken = jwt.sign(
      {
        client_id: apiClient.client_id,
        scope: apiClient.allowed_scopes,
        type: 'client_credentials'
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Log API usage
    await supabase
      .from('api_usage_logs')
      .insert({
        client_id: apiClient.id,
        endpoint: '/oauth/token',
        method: 'POST',
        status_code: 200,
        user_agent: req.get('User-Agent'),
        ip_address: req.ip
      });

    // Update client stats
    await supabase.rpc('increment_client_requests', {
      client_uuid: apiClient.id
    });

    res.json({
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 3600,
      scope: apiClient.allowed_scopes
    });

  } catch (error) {
    logger.error('OAuth token generation failed:', error);
    res.status(500).json({
      error: 'server_error',
      error_description: 'Internal server error'
    });
  }
});

// Verify token middleware
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        error: 'Access token required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.type === 'client_credentials') {
      // API client token
      const { data: client, error } = await supabase
        .from('api_clients')
        .select('*')
        .eq('client_id', decoded.client_id)
        .eq('is_active', true)
        .single();

      if (error || !client) {
        return res.status(401).json({
          error: 'Invalid or inactive client'
        });
      }

      req.client = client;
      req.authType = 'client';
    } else {
      // User token
      const { data: user, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', decoded.userId)
        .eq('is_active', true)
        .single();

      if (error || !user) {
        return res.status(401).json({
          error: 'Invalid or inactive user'
        });
      }

      req.user = user;
      req.authType = 'user';
    }

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expired'
      });
    }
    
    logger.error('Token verification failed:', error);
    res.status(401).json({
      error: 'Invalid token'
    });
  }
};

// Check authentication status
router.get('/me', authenticateToken, async (req, res) => {
  try {
    if (req.authType === 'user') {
      res.json({
        type: 'user',
        user: {
          id: req.user.id,
          abhaAddress: req.user.abha_address,
          name: req.user.full_name,
          organization: req.user.organization,
          role: req.user.role
        }
      });
    } else {
      res.json({
        type: 'client',
        client: {
          id: req.client.id,
          clientId: req.client.client_id,
          name: req.client.client_name,
          organization: req.client.organization,
          scopes: req.client.allowed_scopes
        }
      });
    }
  } catch (error) {
    logger.error('Authentication check failed:', error);
    res.status(500).json({
      error: 'Authentication check failed',
      message: error.message
    });
  }
});

// Logout (invalidate session)
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    // In a production system, you would maintain a token blacklist
    // For now, we'll just update the user's last activity
    if (req.authType === 'user') {
      await supabase
        .from('user_profiles')
        .update({ 
          updated_at: new Date().toISOString()
        })
        .eq('id', req.user.id);
    }

    res.json({
      message: 'Logout successful'
    });
  } catch (error) {
    logger.error('Logout failed:', error);
    res.status(500).json({
      error: 'Logout failed',
      message: error.message
    });
  }
});

export default router;