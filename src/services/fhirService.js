/**
 * FHIR R4 Terminology Service Client
 * Frontend interface for Ministry of AYUSH FHIR endpoints with ABHA authentication
 */

import { v4 as uuidv4 } from 'uuid';
import { resolveApiUrl } from '../config/api';

// Legacy class for backward compatibility
class FhirService {
  createDiagnosisBundle(problems, patient, options = {}) {
    // Fallback to create simple bundle - replaced by FhirTerminologyService
    console.warn('Using legacy createDiagnosisBundle - consider using FhirTerminologyService');
    
    if (!problems || problems.length === 0) {
      throw new Error('No problems provided for FHIR bundle creation');
    }

    if (!patient || !patient.id) {
      throw new Error('Patient information is required for FHIR bundle creation');
    }

    const bundleId = options.bundleId || `bundle-${uuidv4()}`;
    const timestamp = new Date().toISOString();
    
    const bundle = {
      resourceType: 'Bundle',
      id: bundleId,
      type: 'transaction',
      timestamp,
      entry: problems.map(problem => ({
        resource: {
          resourceType: 'Condition',
          id: `condition-${problem.id || uuidv4()}`,
          subject: { reference: `Patient/${patient.id}` },
          code: {
            coding: [{
              system: 'https://terminology.mohfw.gov.in/fhir/CodeSystem/namaste-codes',
              code: problem.code,
              display: problem.display
            }]
          },
          clinicalStatus: {
            coding: [{
              system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
              code: 'active'
            }]
          }
        },
        request: {
          method: 'POST',
          url: 'Condition'
        }
      }))
    };

    return bundle;
  }

  // Other legacy methods maintained for compatibility
  async saveDiagnosisSession(session) {
    try {
      const response = await fetch(resolveApiUrl('/api/v1/diagnosis-sessions'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(session),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save diagnosis session');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Diagnosis Session Save Error:', error);
      throw error;
    }
  }
}

/**
 * FHIR R4 Terminology Service with ABHA Authentication
 */
const FHIR_BASE_URL = import.meta.env.VITE_FHIR_BASE_URL || 'http://localhost:3002/fhir';

class FhirTerminologyService {
  constructor(abhaToken) {
    this.abhaToken = abhaToken;
    this.headers = {
      'Content-Type': 'application/fhir+json',
      'Accept': 'application/fhir+json',
      'Authorization': `Bearer ${abhaToken}`,
      'X-Session-ID': `session-${Date.now()}`,
      'X-Purpose-Of-Use': 'treatment'
    };
  }

  /**
   * Get FHIR server capabilities
   */
  async getCapabilities() {
    try {
      const response = await fetch(`${FHIR_BASE_URL}/metadata`, {
        headers: this.headers
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching capabilities:', error);
      throw error;
    }
  }

  /**
   * Get NAMASTE CodeSystem
   */
  async getNamasteCodeSystem() {
    try {
      const response = await fetch(`${FHIR_BASE_URL}/CodeSystem/namaste-codes`, {
        headers: this.headers
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching NAMASTE CodeSystem:', error);
      throw error;
    }
  }

  /**
   * Get ConceptMap for NAMASTE to ICD-11 TM2
   */
  async getConceptMap() {
    try {
      const response = await fetch(`${FHIR_BASE_URL}/ConceptMap/namaste-to-icd11-tm2`, {
        headers: this.headers
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching ConceptMap:', error);
      throw error;
    }
  }

  /**
   * Search NAMASTE codes with auto-complete
   */
  async searchCodes(filter = '', count = 20, offset = 0) {
    try {
      const params = new URLSearchParams({
        filter: filter,
        count: count.toString(),
        offset: offset.toString()
      });

      const response = await fetch(`${FHIR_BASE_URL}/ValueSet/namaste-codes/$expand?${params}`, {
        headers: this.headers
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const valueSet = await response.json();
      
      // Transform FHIR ValueSet to user-friendly format
      return {
        total: valueSet.expansion?.total || 0,
        results: (valueSet.expansion?.contains || []).map(concept => ({
          code: concept.code,
          display: concept.display,
          system: concept.system,
          category: concept.property?.find(p => p.code === 'category')?.valueString,
          ayushSystem: concept.property?.find(p => p.code === 'ayush_system')?.valueString,
          confidence: concept.property?.find(p => p.code === 'mapping_confidence')?.valueDecimal,
          description: concept.designation?.[0]?.value
        }))
      };
    } catch (error) {
      console.error('Error searching codes:', error);
      throw error;
    }
  }

  /**
   * Translate NAMASTE code to ICD-11 TM2
   */
  async translateCode(system, code) {
    try {
      const params = new URLSearchParams({
        system: system,
        code: code
      });

      const response = await fetch(`${FHIR_BASE_URL}/ConceptMap/namaste-to-icd11-tm2/$translate?${params}`, {
        headers: this.headers
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const parameters = await response.json();
      
      // Extract translation results
      const result = parameters.parameter?.find(p => p.name === 'result')?.valueBoolean;
      const matches = parameters.parameter?.filter(p => p.name === 'match') || [];
      
      return {
        success: result,
        translations: matches.map(match => {
          const equivalence = match.part?.find(p => p.name === 'equivalence')?.valueCode;
          const concept = match.part?.find(p => p.name === 'concept')?.valueCoding;
          const confidence = match.part?.find(p => p.name === 'product')?.part
            ?.find(p => p.name === 'value')?.valueString;
          
          return {
            equivalence,
            targetCode: concept?.code,
            targetDisplay: concept?.display,
            targetSystem: concept?.system,
            confidence: parseFloat(confidence) || 0
          };
        })
      };
    } catch (error) {
      console.error('Error translating code:', error);
      throw error;
    }
  }

  /**
   * Create FHIR Bundle with dual coding
   */
  async createBundle(bundle, consentId = null) {
    try {
      const headers = { ...this.headers };
      if (consentId) {
        headers['X-ABHA-Consent-ID'] = consentId;
      }

      const response = await fetch(`${FHIR_BASE_URL}/Bundle`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(bundle)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.issue?.[0]?.diagnostics || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error creating bundle:', error);
      throw error;
    }
  }

  /**
   * Create a diagnosis condition with dual coding
   */
  async createDiagnosisCondition(patientId, namasteCode, namasteDisplay, clinicalStatus = 'active') {
    const condition = {
      resourceType: "Condition",
      id: `condition-${Date.now()}`,
      subject: {
        reference: `Patient/${patientId}`
      },
      code: {
        coding: [
          {
            system: "https://terminology.mohfw.gov.in/fhir/CodeSystem/namaste-codes",
            code: namasteCode,
            display: namasteDisplay
          }
        ],
        text: namasteDisplay
      },
      clinicalStatus: {
        coding: [
          {
            system: "http://terminology.hl7.org/CodeSystem/condition-clinical",
            code: clinicalStatus
          }
        ]
      },
      verificationStatus: {
        coding: [
          {
            system: "http://terminology.hl7.org/CodeSystem/condition-ver-status",
            code: "confirmed"
          }
        ]
      },
      category: [
        {
          coding: [
            {
              system: "http://terminology.hl7.org/CodeSystem/condition-category",
              code: "encounter-diagnosis"
            }
          ]
        }
      ],
      onsetDateTime: new Date().toISOString().split('T')[0]
    };

    const bundle = {
      resourceType: "Bundle",
      type: "transaction",
      entry: [
        {
          resource: condition,
          request: {
            method: "POST",
            url: "Condition"
          }
        }
      ]
    };

    return await this.createBundle(bundle);
  }
}

/**
 * Hook to use FHIR Terminology Service with ABHA authentication
 */
export const useFhirTerminology = (abhaToken) => {
  if (!abhaToken) {
    return null;
  }
  
  return new FhirTerminologyService(abhaToken);
};

export { FhirTerminologyService };
export default new FhirService();