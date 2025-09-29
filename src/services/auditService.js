// Mock audit service for admin dashboard

// Mock audit logs data
const mockAuditLogs = [
  {
    id: 'audit-001',
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 min ago
    user_id: 'abha-001',
    user_name: 'Dr. Administrative Officer',
    activity_type: 'login',
    resource: 'Clinical Diagnosis Entry',
    action: 'Authentication',
    details: 'ABHA authentication successful',
    ip_address: '192.168.1.100',
    user_agent: 'Mozilla/5.0 Chrome/120.0',
    status: 'success',
    abha_id: '14-1234-5678-9012'
  },
  {
    id: 'audit-002',
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // 45 min ago
    user_id: 'abha-002',
    user_name: 'Dr. Clinical Specialist',
    activity_type: 'diagnosis',
    resource: 'NAMASTE Code Search',
    action: 'Search',
    details: 'Searched for "fever" - 5 results returned',
    ip_address: '192.168.1.101',
    user_agent: 'Mozilla/5.0 Chrome/120.0',
    status: 'success',
    abha_id: '14-2345-6789-0123'
  },
  {
    id: 'audit-003',
    timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1 hour ago
    user_id: 'abha-002',
    user_name: 'Dr. Clinical Specialist',
    activity_type: 'api_call',
    resource: 'FHIR Bundle Export',
    action: 'Export',
    details: 'Generated FHIR R4 bundle for patient P001',
    ip_address: '192.168.1.101',
    user_agent: 'Mozilla/5.0 Chrome/120.0',
    status: 'success',
    abha_id: '14-2345-6789-0123'
  },
  {
    id: 'audit-004',
    timestamp: new Date(Date.now() - 90 * 60 * 1000).toISOString(), // 1.5 hours ago
    user_id: 'abha-003',
    user_name: 'Dr. Ayurveda Practitioner',
    activity_type: 'mapping',
    resource: 'NAMASTE to ICD-11 Mapping',
    action: 'Create Mapping',
    details: 'Created mapping from NAMASTE-0001 to ICD-11 TM2-XY01',
    ip_address: '192.168.1.102',
    user_agent: 'Mozilla/5.0 Safari/17.0',
    status: 'success',
    abha_id: '14-3456-7890-1234'
  },
  {
    id: 'audit-005',
    timestamp: new Date(Date.now() - 120 * 60 * 1000).toISOString(), // 2 hours ago
    user_id: 'abha-001',
    user_name: 'Dr. Administrative Officer',
    activity_type: 'mapping',
    resource: 'NAMASTE Code Validation',
    action: 'Validate Mapping',
    details: 'Validated 3 NAMASTE codes against ICD-11 TM2',
    ip_address: '192.168.1.100',
    user_agent: 'Mozilla/5.0 Chrome/120.0',
    status: 'success',
    abha_id: '14-1234-5678-9012'
  }
];

// Mock consent records data
const mockConsentRecords = [
  {
    id: 'consent-001',
    patient_mrn: 'MRN-001',
    patient_name: 'Patient A',
    consent_type: 'fhir_export',
    consent_status: 'granted',
    consent_version: 'v1.0',
    consent_scope: 'diagnosis_data',
    effective_from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    effective_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    evidence_url: 'https://example.com/consent/001',
    notes: 'Patient consented to FHIR data export for AYUSH treatment',
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    created_by: 'Dr. Administrative Officer'
  },
  {
    id: 'consent-002',
    patient_mrn: 'MRN-002',
    patient_name: 'Patient B',
    consent_type: 'data_sharing',
    consent_status: 'granted',
    consent_version: 'v1.1',
    consent_scope: 'full_medical_record',
    effective_from: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    effective_until: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
    evidence_url: 'https://example.com/consent/002',
    notes: 'Comprehensive data sharing consent for research purposes',
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    created_by: 'Dr. Clinical Specialist'
  },
  {
    id: 'consent-003',
    patient_mrn: 'MRN-003',
    patient_name: 'Patient C',
    consent_type: 'terminology_upload',
    consent_status: 'expired',
    consent_version: 'v1.0',
    consent_scope: 'namaste_codes',
    effective_from: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    effective_until: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    evidence_url: 'https://example.com/consent/003',
    notes: 'Consent expired - needs renewal',
    created_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    created_by: 'Dr. Administrative Officer'
  }
];

class AuditService {
  // Simulate delay for realistic API behavior
  async delay(ms = 500) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async getAuditLogs(options = {}) {
    await this.delay();
    
    const { page = 1, limit = 10, activity_type, status } = options;
    
    // Filter data based on options
    let filteredLogs = [...mockAuditLogs];
    
    if (activity_type && activity_type !== 'all') {
      filteredLogs = filteredLogs.filter(log => log.activity_type === activity_type);
    }
    
    if (status && status !== 'all') {
      filteredLogs = filteredLogs.filter(log => log.status === status);
    }
    
    // Sort by timestamp (newest first)
    filteredLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Paginate
    const total = filteredLogs.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedData = filteredLogs.slice(startIndex, endIndex);
    
    return {
      data: paginatedData,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async getConsentRecords(options = {}) {
    await this.delay();
    
    const { page = 1, limit = 10, consentStatus, consentType } = options;
    
    // Filter data based on options
    let filteredRecords = [...mockConsentRecords];
    
    if (consentStatus && consentStatus !== 'all') {
      filteredRecords = filteredRecords.filter(record => record.consent_status === consentStatus);
    }
    
    if (consentType && consentType !== 'all') {
      filteredRecords = filteredRecords.filter(record => record.consent_type === consentType);
    }
    
    // Sort by created_at (newest first)
    filteredRecords.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    // Paginate
    const total = filteredRecords.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedData = filteredRecords.slice(startIndex, endIndex);
    
    return {
      data: paginatedData,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async createConsentRecord(payload = {}) {
    await this.delay();
    
    const newRecord = {
      id: `consent-${Date.now()}`,
      patient_mrn: payload.patientMrn || `MRN-${Date.now()}`,
      patient_name: payload.patientName || 'New Patient',
      consent_type: payload.consentType || 'fhir_export',
      consent_status: payload.consentStatus || 'granted',
      consent_version: payload.consentVersion || 'v1.0',
      consent_scope: payload.consentScope || 'diagnosis_data',
      effective_from: payload.effectiveFrom || new Date().toISOString(),
      effective_until: payload.effectiveUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      evidence_url: payload.evidenceUrl || '',
      notes: payload.notes || '',
      created_at: new Date().toISOString(),
      created_by: 'Current User'
    };
    
    // Add to mock data
    mockConsentRecords.unshift(newRecord);
    
    return newRecord;
  }
}

export const auditService = new AuditService();
export default auditService;
