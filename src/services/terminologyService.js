import { supabase } from '../lib/supabase';
import { resolveApiUrl } from '../config/api';

class TerminologyService {
  constructor() {
    this.baseUrl = resolveApiUrl('/api/v1');
  }
  
  // Translate between terminology systems
  async translateCode(source, target, code, includeMetadata = false, format = 'standard') {
    try {
      const response = await fetch(`${this.baseUrl}/translation/translate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source,
          target,
          code,
          includeMetadata,
          format
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Translation failed');
      }
      
      const data = await response.json();
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  // Search terminologies using the backend API
  async searchTerminologies(query, system = 'ALL', limit = 50) {
    try {
      const response = await fetch(
        `${this.baseUrl}/terminology/search?query=${encodeURIComponent(query)}&system=${system}&limit=${limit}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return { data: data.results, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  // Get all terminology mappings using the backend API
  async getAllMappings(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.page) params.append('page', filters.page);
      if (filters.limit) params.append('limit', filters.limit);

      const response = await fetch(`${this.baseUrl}/terminology/mappings?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return { data: data.mappings, pagination: data.pagination, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  // Create new terminology mapping
  async createMapping(mappingData) {
    try {
      const { data: { user } } = await supabase?.auth?.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase?.from('terminology_mappings')?.insert({
          ...mappingData,
          created_by: user?.id
        })?.select()?.single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  // Update terminology mapping
  async updateMapping(id, updates) {
    try {
      const { data, error } = await supabase?.from('terminology_mappings')?.update(updates)?.eq('id', id)?.select()?.single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  // Delete terminology mapping
  async deleteMapping(id) {
    try {
      const { error } = await supabase?.from('terminology_mappings')?.delete()?.eq('id', id);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error };
    }
  }

  // Approve terminology mapping
  async approveMapping(id) {
    try {
      const { data: { user } } = await supabase?.auth?.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase?.from('terminology_mappings')?.update({
          status: 'approved',
          approved_by: user?.id
        })?.eq('id', id)?.select()?.single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  // Search mappings by term
  async searchMappings(searchTerm) {
    try {
      const { data, error } = await supabase?.from('terminology_mappings')?.select('*')?.or(`ayush_term.ilike.%${searchTerm}%,icd11_term.ilike.%${searchTerm}%,ayush_code.ilike.%${searchTerm}%`)?.eq('status', 'approved')?.limit(50);

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  // Create a FHIR bundle from diagnoses
  createFhirBundle(patientRef, diagnoses) {
    if (!patientRef || !diagnoses?.length) {
      return { error: 'Patient reference and diagnoses are required' };
    }

    return {
      error: null,
      data: {
        resourceType: 'Bundle',
        type: 'transaction',
        timestamp: new Date().toISOString(),
        entry: diagnoses.map(diagnosis => ({
          resource: {
            resourceType: 'Condition',
            id: `condition-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            clinicalStatus: {
              coding: [{
                system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
                code: 'active',
                display: 'Active'
              }]
            },
            verificationStatus: {
              coding: [{
                system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status',
                code: 'confirmed',
                display: 'Confirmed'
              }]
            },
            category: [{
              coding: [{
                system: 'http://terminology.hl7.org/CodeSystem/condition-category',
                code: 'problem-list-item',
                display: 'Problem List Item'
              }]
            }],
            code: {
              coding: [
                {
                  system: 'http://terminology.ayush.gov.in/CodeSystem/namaste',
                  code: diagnosis.namasteCode || diagnosis.code,
                  display: diagnosis.namasteDisplay || diagnosis.display
                },
                ...(diagnosis.icd11Code || (diagnosis.icd11 && diagnosis.icd11.code) ? [{
                  system: 'http://id.who.int/icd/release/11/mms',
                  code: diagnosis.icd11Code || diagnosis.icd11.code,
                  display: diagnosis.icd11Display || diagnosis.icd11.display
                }] : [])
              ]
            },
            subject: patientRef,
            recordedDate: new Date().toISOString()
          },
          request: {
            method: 'POST',
            url: 'Condition'
          }
        }))
      }
    };
  }

  // Get mapping statistics
  async getMappingStats() {
    try {
      const { data: totalMappings, error: totalError } = await supabase?.from('terminology_mappings')?.select('id', { count: 'exact', head: true });

      const { data: approvedMappings, error: approvedError } = await supabase?.from('terminology_mappings')?.select('id', { count: 'exact', head: true })?.eq('status', 'approved');

      const { data: pendingMappings, error: pendingError } = await supabase?.from('terminology_mappings')?.select('id', { count: 'exact', head: true })?.eq('status', 'pending');

      if (totalError || approvedError || pendingError) {
        throw totalError || approvedError || pendingError;
      }

      return {
        data: {
          total: totalMappings || 0,
          approved: approvedMappings || 0,
          pending: pendingMappings || 0,
          accuracy: approvedMappings > 0 ? ((approvedMappings / totalMappings) * 100)?.toFixed(1) : '0.0'
        },
        error: null
      };
    } catch (error) {
      return { data: null, error };
    }
  }

  // Subscribe to terminology mapping changes
  subscribeToMappings(callback) {
    return supabase?.channel('terminology_mappings')?.on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'terminology_mappings' },
        callback
      )?.subscribe();
  }
}

export const terminologyService = new TerminologyService();
export default terminologyService;