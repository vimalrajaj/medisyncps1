/**
 * Mock ABHA Authentication Service
 * Simulates real ABHA login flow for demo purposes
 */

// Mock ABHA users database
const mockAbhaUsers = [
  {
    id: 'abha-001',
    abha_id: '14-1234-5678-9012',
    abha_address: 'dr.admin@sbx',
    email: 'admin@ayush.gov.in',
    password: 'Admin@123',
    name: 'Dr. Administrative Officer',
    roles: ['healthcare_provider', 'ayush_practitioner', 'admin'],
    hpr_id: 'HPR-12345',
    facility_id: 'FAC-67890',
    profile: {
      specialization: 'Ayurveda Administration',
      qualification: 'BAMS, MD (Ayurveda)',
      registration_number: 'REG-ADMIN-001',
      department: 'Ministry of AYUSH'
    }
  },
  {
    id: 'abha-002',
    abha_id: '14-2345-6789-0123',
    abha_address: 'dr.clinical@sbx',
    email: 'doctor@ayush.clinic',
    password: 'Doctor@123',
    name: 'Dr. Clinical Practitioner',
    roles: ['healthcare_provider', 'ayush_practitioner'],
    hpr_id: 'HPR-23456',
    facility_id: 'FAC-78901',
    profile: {
      specialization: 'Panchakarma Therapy',
      qualification: 'BAMS, MS (Ayurveda)',
      registration_number: 'REG-DOC-002',
      department: 'Clinical Practice'
    }
  },
  {
    id: 'abha-003',
    abha_id: '14-3456-7890-1234',
    abha_address: 'viewer.user@sbx',
    email: 'viewer@ayush.org',
    password: 'Viewer@123',
    name: 'Research Viewer',
    roles: ['viewer', 'researcher'],
    hpr_id: 'HPR-34567',
    facility_id: 'FAC-89012',
    profile: {
      specialization: 'Research & Documentation',
      qualification: 'MSc (Medical Research)',
      registration_number: 'REG-VIEW-003',
      department: 'Research Division'
    }
  }
];

/**
 * Mock ABHA Authentication Service
 */
class MockAbhaAuthService {
  constructor() {
    this.currentUser = null;
    this.currentSession = null;
  }

  /**
   * Authenticate user with ABHA ID
   */
  async signIn(abhaId) {
    console.log('🔐 MockABHA: Attempting authentication', { abhaId });
    
    // Simulate network delay
    await this.delay(800);
    
    // Find user in mock database by ABHA ID
    const user = mockAbhaUsers.find(u => 
      u.abha_id === abhaId
    );
    
    if (!user) {
      console.error('❌ MockABHA: Invalid ABHA ID');
      return {
        data: null,
        error: { 
          message: 'Invalid ABHA ID. Please check your ABHA ID format (XX-XXXX-XXXX-XXXX).',
          code: 'invalid_abha_id'
        }
      };
    }
    
    // Create session
    const session = this.createSession(user);
    this.currentUser = user;
    this.currentSession = session;
    
    console.log('✅ MockABHA: Authentication successful', {
      user: user.name,
      abha_id: user.abha_id,
      roles: user.roles
    });
    
    return {
      data: {
        user: this.sanitizeUser(user),
        session: session
      },
      error: null
    };
  }

  /**
   * Sign out current user
   */
  async signOut() {
    console.log('🚪 MockABHA: Signing out');
    this.currentUser = null;
    this.currentSession = null;
    
    return { error: null };
  }

  /**
   * Get current session
   */
  async getSession() {
    return {
      data: {
        session: this.currentSession
      },
      error: null
    };
  }

  /**
   * Get current user profile
   */
  async getUserProfile(userId) {
    if (!this.currentUser || this.currentUser.id !== userId) {
      return {
        data: null,
        error: { message: 'User not found' }
      };
    }

    return {
      data: this.currentUser,
      error: null
    };
  }

  /**
   * Generate ABHA token
   */
  generateAbhaToken(user) {
    const tokenPayload = {
      sub: user.id,
      abha_id: user.abha_id,
      abha_address: user.abha_address,
      name: user.name,
      roles: user.roles,
      scope: 'terminology.read terminology.write bundle.create bundle.read',
      hpr_id: user.hpr_id,
      facility_id: user.facility_id,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (60 * 60 * 8) // 8 hours
    };
    
    // Create mock JWT token
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify(tokenPayload));
    const signature = btoa(`mock-signature-${user.id}`);
    
    return `${header}.${payload}.${signature}`;
  }

  /**
   * Create user session
   */
  createSession(user) {
    return {
      access_token: this.generateAbhaToken(user),
      token_type: 'bearer',
      expires_in: 28800, // 8 hours
      expires_at: Math.floor(Date.now() / 1000) + 28800,
      refresh_token: `refresh_${user.id}_${Date.now()}`,
      user: this.sanitizeUser(user)
    };
  }

  /**
   * Remove sensitive data from user object
   */
  sanitizeUser(user) {
    const { password, ...sanitized } = user;
    return sanitized;
  }

  /**
   * Simulate network delay
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Validate ABHA token (for FHIR endpoints)
   */
  validateToken(token) {
    try {
      const [header, payload, signature] = token.split('.');
      const decodedPayload = JSON.parse(atob(payload));
      
      // Check expiration
      if (decodedPayload.exp < Math.floor(Date.now() / 1000)) {
        return { valid: false, error: 'Token expired' };
      }
      
      return {
        valid: true,
        userId: decodedPayload.sub,
        abhaId: decodedPayload.abha_id,
        abhaAddress: decodedPayload.abha_address,
        roles: decodedPayload.roles,
        scope: decodedPayload.scope?.split(' ') || [],
        healthcareProviderId: decodedPayload.hpr_id,
        facilityId: decodedPayload.facility_id
      };
    } catch (error) {
      return { valid: false, error: 'Invalid token format' };
    }
  }
}

// Create singleton instance
export const mockAbhaAuth = new MockAbhaAuthService();

export default mockAbhaAuth;