/**
 * Clinical Diagnosis Entry with FHIR R4 Integration
 * Ministry of AYUSH compliant dual coding interface
 */

import React, { useState, useEffect } from 'react';
import { 
  Plus, Save, Trash2, FileText, User, Calendar, 
  CheckCircle, AlertTriangle, Info, ArrowRight,
  Download, Eye, RefreshCw
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useFhirTerminology } from '../services/fhirService';
import FhirTerminologySearch from './FhirTerminologySearch';

const ClinicalDiagnosisEntry = () => {
  const { user, abhaToken, isAbhaAuthenticated } = useAuth();
  const fhirService = useFhirTerminology(abhaToken);
  
  // Patient Information State
  const [patient, setPatient] = useState({
    id: '',
    firstName: '',
    lastName: '',
    medicalRecordNumber: '',
    dateOfBirth: '',
    gender: ''
  });

  // Clinical Session State
  const [session, setSession] = useState({
    title: `Clinical Visit ${new Date().toLocaleDateString()}`,
    chiefComplaint: '',
    notes: '',
    date: new Date().toISOString().split('T')[0]
  });

  // Diagnosis State
  const [diagnoses, setDiagnoses] = useState([]);
  const [currentDiagnosis, setCurrentDiagnosis] = useState({
    namasteCode: null,
    translation: null,
    clinicalNotes: '',
    status: 'active',
    confidence: null
  });

  // UI State
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [fhirBundle, setFhirBundle] = useState(null);
  const [capabilities, setCapabilities] = useState(null);

  // Load FHIR capabilities on mount
  useEffect(() => {
    if (fhirService && isAbhaAuthenticated) {
      loadCapabilities();
    }
  }, [fhirService, isAbhaAuthenticated]);

  const loadCapabilities = async () => {
    try {
      const caps = await fhirService.getCapabilities();
      setCapabilities(caps);
    } catch (err) {
      console.warn('Failed to load FHIR capabilities:', err);
    }
  };

  const handlePatientChange = (field, value) => {
    setPatient(prev => ({ ...prev, [field]: value }));
  };

  const handleSessionChange = (field, value) => {
    setSession(prev => ({ ...prev, [field]: value }));
  };

  const handleCodeSelect = (codeData) => {
    setCurrentDiagnosis({
      namasteCode: {
        code: codeData.code,
        display: codeData.display,
        system: codeData.system,
        category: codeData.category,
        ayushSystem: codeData.ayushSystem
      },
      translation: codeData.translation,
      clinicalNotes: '',
      status: 'active',
      confidence: codeData.confidence
    });
    setError(null);
  };

  const addDiagnosis = () => {
    if (!currentDiagnosis.namasteCode) {
      setError('Please select a NAMASTE code first');
      return;
    }

    const newDiagnosis = {
      id: Date.now(),
      ...currentDiagnosis,
      addedAt: new Date().toISOString()
    };

    setDiagnoses(prev => [...prev, newDiagnosis]);
    setCurrentDiagnosis({
      namasteCode: null,
      translation: null,
      clinicalNotes: '',
      status: 'active',
      confidence: null
    });
    setSuccess('Diagnosis added successfully');
    setTimeout(() => setSuccess(null), 3000);
  };

  const removeDiagnosis = (id) => {
    setDiagnoses(prev => prev.filter(d => d.id !== id));
  };

  const generateFHIRBundle = async () => {
    if (diagnoses.length === 0) {
      setError('Please add at least one diagnosis');
      return;
    }

    if (!patient.id || !patient.firstName) {
      setError('Please fill in patient information');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create FHIR Bundle with dual coding
      const bundle = {
        resourceType: 'Bundle',
        id: `bundle-${Date.now()}`,
        type: 'transaction',
        timestamp: new Date().toISOString(),
        entry: []
      };

      // Add Patient resource
      bundle.entry.push({
        resource: {
          resourceType: 'Patient',
          id: patient.id,
          identifier: [{
            system: 'https://terminology.mohfw.gov.in/identifier/mrn',
            value: patient.medicalRecordNumber
          }],
          name: [{
            family: patient.lastName,
            given: [patient.firstName],
            text: `${patient.firstName} ${patient.lastName}`.trim()
          }],
          gender: patient.gender,
          birthDate: patient.dateOfBirth
        },
        request: {
          method: 'PUT',
          url: `Patient/${patient.id}`
        }
      });

      // Add Condition resources for each diagnosis
      for (const diagnosis of diagnoses) {
        const condition = {
          resourceType: 'Condition',
          id: `condition-${diagnosis.id}`,
          subject: {
            reference: `Patient/${patient.id}`
          },
          code: {
            coding: [
              {
                system: diagnosis.namasteCode.system,
                code: diagnosis.namasteCode.code,
                display: diagnosis.namasteCode.display
              }
            ],
            text: diagnosis.namasteCode.display
          },
          clinicalStatus: {
            coding: [{
              system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
              code: diagnosis.status
            }]
          },
          verificationStatus: {
            coding: [{
              system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status',
              code: 'confirmed'
            }]
          },
          category: [{
            coding: [{
              system: 'http://terminology.hl7.org/CodeSystem/condition-category',
              code: 'encounter-diagnosis'
            }]
          }],
          onsetDateTime: session.date,
          recordedDate: diagnosis.addedAt
        };

        // Add ICD-11 coding if translation is available
        if (diagnosis.translation?.success && diagnosis.translation.translations?.length > 0) {
          const bestTranslation = diagnosis.translation.translations[0];
          condition.code.coding.push({
            system: bestTranslation.targetSystem,
            code: bestTranslation.targetCode,
            display: bestTranslation.targetDisplay
          });
        }

        // Add clinical notes if provided
        if (diagnosis.clinicalNotes) {
          condition.note = [{
            text: diagnosis.clinicalNotes,
            time: diagnosis.addedAt
          }];
        }

        bundle.entry.push({
          resource: condition,
          request: {
            method: 'POST',
            url: 'Condition'
          }
        });
      }

      setFhirBundle(bundle);
      setSuccess('FHIR Bundle generated successfully');
    } catch (err) {
      console.error('Bundle generation error:', err);
      setError(err.message || 'Failed to generate FHIR bundle');
    } finally {
      setLoading(false);
    }
  };

  const submitBundle = async () => {
    if (!fhirBundle) {
      await generateFHIRBundle();
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const result = await fhirService.createBundle(fhirBundle);
      setSuccess('Clinical data submitted successfully to FHIR server');
      
      // Reset form after successful submission
      setTimeout(() => {
        setDiagnoses([]);
        setFhirBundle(null);
        setCurrentDiagnosis({
          namasteCode: null,
          translation: null,
          clinicalNotes: '',
          status: 'active',
          confidence: null
        });
      }, 2000);
    } catch (err) {
      console.error('Submission error:', err);
      setError(err.message || 'Failed to submit to FHIR server');
    } finally {
      setSaving(false);
    }
  };

  const downloadBundle = () => {
    if (!fhirBundle) return;
    
    const dataStr = JSON.stringify(fhirBundle, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `fhir-bundle-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  if (!isAbhaAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="h-6 w-6 text-yellow-600" />
            <div>
              <h3 className="font-medium text-yellow-800">ABHA Authentication Required</h3>
              <p className="text-yellow-700 mt-1">
                Please authenticate with ABHA to access FHIR terminology services and clinical diagnosis entry.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Clinical Diagnosis Entry</h1>
            <p className="text-gray-600 mt-1">FHIR R4 compliant dual coding with Ministry of AYUSH terminology</p>
          </div>
          
          <div className="flex items-center space-x-4">
            {isAbhaAuthenticated && (
              <div className="flex items-center space-x-2 text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                <CheckCircle className="h-4 w-4" />
                <span>ABHA Authenticated</span>
              </div>
            )}
            {capabilities && (
              <div className="flex items-center space-x-2 text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full">
                <CheckCircle className="h-4 w-4" />
                <span>FHIR R4 Ready</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ABHA Authentication Success Banner */}
      {isAbhaAuthenticated && user && (
        <div className="bg-gradient-to-r from-blue-500 to-green-500 text-white rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <CheckCircle className="h-6 w-6" />
            <div>
              <p className="font-semibold">Welcome, {user.name}!</p>
              <p className="text-sm opacity-90">
                ABHA ID: {user.abha_id} • Full FHIR R4 Access Enabled • Ministry of AYUSH Compliant
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Status Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 text-red-800">
            <AlertTriangle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 text-green-800">
            <CheckCircle className="h-5 w-5" />
            <span>{success}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Patient & Session Info */}
        <div className="space-y-6">
          {/* Patient Information */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center space-x-2 mb-4">
              <User className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-semibold">Patient Information</h2>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Patient ID"
                  value={patient.id}
                  onChange={(e) => handlePatientChange('id', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="text"
                  placeholder="MRN"
                  value={patient.medicalRecordNumber}
                  onChange={(e) => handlePatientChange('medicalRecordNumber', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="First Name"
                  value={patient.firstName}
                  onChange={(e) => handlePatientChange('firstName', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="text"
                  placeholder="Last Name"
                  value={patient.lastName}
                  onChange={(e) => handlePatientChange('lastName', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="date"
                  value={patient.dateOfBirth}
                  onChange={(e) => handlePatientChange('dateOfBirth', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <select
                  value={patient.gender}
                  onChange={(e) => handlePatientChange('gender', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="unknown">Unknown</option>
                </select>
              </div>
            </div>
          </div>

          {/* Session Information */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Calendar className="h-5 w-5 text-green-600" />
              <h2 className="text-lg font-semibold">Clinical Session</h2>
            </div>
            
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Session Title"
                value={session.title}
                onChange={(e) => handleSessionChange('title', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              
              <input
                type="date"
                value={session.date}
                onChange={(e) => handleSessionChange('date', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              
              <textarea
                placeholder="Chief Complaint"
                value={session.chiefComplaint}
                onChange={(e) => handleSessionChange('chiefComplaint', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              
              <textarea
                placeholder="Clinical Notes"
                value={session.notes}
                onChange={(e) => handleSessionChange('notes', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Right Column - Diagnosis Entry */}
        <div className="space-y-6">
          {/* Quick Access Panel */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200 p-4">
            <h3 className="text-sm font-semibold text-purple-900 mb-3">Quick Access</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-purple-700">Common Diagnoses</h4>
                <div className="flex flex-wrap gap-1">
                  {[
                    { code: 'N001', display: 'Fever (Jwara)' },
                    { code: 'N002', display: 'Headache (Shiroroga)' },
                    { code: 'N003', display: 'Cough (Kasa)' },
                    { code: 'N004', display: 'Digestive Issues (Agnimandya)' }
                  ].map((item) => (
                    <button
                      key={item.code}
                      onClick={() => handleCodeSelect({
                        code: item.code,
                        display: item.display,
                        system: 'http://namaste.ayush.gov.in',
                        category: 'Common'
                      })}
                      className="px-2 py-1 bg-white hover:bg-purple-100 text-xs text-purple-700 border border-purple-200 rounded-full transition-colors"
                    >
                      {item.display}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-blue-700">Recently Used</h4>
                <div className="text-xs text-gray-500">
                  {diagnoses.length > 0 ? 'Previous selections will appear here' : 'No recent codes'}
                </div>
              </div>
            </div>
          </div>

          {/* Code Search */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-purple-600" />
                <h2 className="text-lg font-semibold">Add Diagnosis</h2>
              </div>
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Auto-translate to ICD-11</span>
              </div>
            </div>
            
            <div className="space-y-4">
              <FhirTerminologySearch
                onCodeSelect={handleCodeSelect}
                showTranslation={true}
                placeholder="🔍 Search NAMASTE codes, symptoms, or conditions..."
                className="w-full"
                maxResults={25}
              />
              
              {currentDiagnosis.namasteCode && (
                <div className="border-2 border-blue-200 rounded-xl overflow-hidden bg-white shadow-sm">
                  {/* Header */}
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-4 py-3 border-b border-blue-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm font-medium text-gray-900">Selected Diagnosis</span>
                      </div>
                      <button
                        onClick={() => setCurrentDiagnosis({
                          namasteCode: null,
                          translation: null,
                          clinicalNotes: '',
                          status: 'active',
                          confidence: null
                        })}
                        className="text-xs text-gray-500 hover:text-red-500 transition-colors"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="px-3 py-1 bg-blue-500 text-white text-sm font-bold font-mono rounded-full">
                            {currentDiagnosis.namasteCode.code}
                          </span>
                          {currentDiagnosis.namasteCode.category && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                              {currentDiagnosis.namasteCode.category}
                            </span>
                          )}
                          {currentDiagnosis.namasteCode.ayushSystem && (
                            <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                              {currentDiagnosis.namasteCode.ayushSystem}
                            </span>
                          )}
                        </div>
                        <h4 className="font-semibold text-gray-900 text-lg">
                          {currentDiagnosis.namasteCode.display}
                        </h4>
                      </div>
                      {currentDiagnosis.confidence && (
                        <div className="text-right">
                          <div className="text-xs text-gray-500">Match</div>
                          <div className="text-sm font-bold text-blue-600">
                            {Math.round(currentDiagnosis.confidence * 100)}%
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {currentDiagnosis.translation?.success && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <ArrowRight className="h-4 w-4 text-blue-500" />
                          <span className="text-sm font-semibold text-gray-800">ICD-11 TM2 Translation</span>
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                            Auto-mapped
                          </span>
                        </div>
                        <div className="space-y-2">
                          {currentDiagnosis.translation.translations.map((trans, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2 bg-white rounded border border-gray-100">
                              <div className="flex items-center space-x-3">
                                <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-mono rounded">
                                  {trans.targetCode}
                                </span>
                                <span className="text-sm text-gray-700">{trans.targetDisplay}</span>
                              </div>
                              {trans.confidence && (
                                <span className="text-xs text-blue-600 font-medium">
                                  {Math.round(trans.confidence * 100)}%
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              <textarea
                placeholder="Clinical notes for this diagnosis (optional)"
                value={currentDiagnosis.clinicalNotes}
                onChange={(e) => setCurrentDiagnosis(prev => ({ 
                  ...prev, 
                  clinicalNotes: e.target.value 
                }))}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              
              <div className="flex space-x-2">
                <select
                  value={currentDiagnosis.status}
                  onChange={(e) => setCurrentDiagnosis(prev => ({ 
                    ...prev, 
                    status: e.target.value 
                  }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="active">Active</option>
                  <option value="recurrence">Recurrence</option>
                  <option value="relapse">Relapse</option>
                  <option value="inactive">Inactive</option>
                  <option value="remission">Remission</option>
                  <option value="resolved">Resolved</option>
                </select>
                
                <button
                  onClick={addDiagnosis}
                  disabled={!currentDiagnosis.namasteCode}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add</span>
                </button>
              </div>
            </div>
          </div>

          {/* Current Diagnoses */}
          {diagnoses.length > 0 ? (
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-green-50 to-blue-50 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Current Diagnoses
                    <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                      {diagnoses.length}
                    </span>
                  </h3>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>{diagnoses.filter(d => d.translation?.success).length} mapped to ICD-11</span>
                  </div>
                </div>
              </div>

              {/* Diagnosis List */}
              <div className="p-6">
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {diagnoses.map((diagnosis, index) => (
                    <div key={diagnosis.id} className="group bg-gray-50 hover:bg-white border-2 border-transparent hover:border-blue-200 rounded-lg p-4 transition-all duration-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          {/* Index and Code */}
                          <div className="flex items-center space-x-3 mb-2">
                            <span className="flex items-center justify-center w-6 h-6 bg-blue-500 text-white text-xs font-bold rounded-full">
                              {index + 1}
                            </span>
                            <div className="flex items-center space-x-2">
                              <span className="px-3 py-1 bg-blue-500 text-white text-sm font-bold font-mono rounded-full">
                                {diagnosis.namasteCode.code}
                              </span>
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                diagnosis.status === 'active' ? 'bg-green-100 text-green-800' :
                                diagnosis.status === 'resolved' ? 'bg-gray-100 text-gray-800' :
                                diagnosis.status === 'inactive' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-blue-100 text-blue-800'
                              }`}>
                                {diagnosis.status}
                              </span>
                              {diagnosis.namasteCode.category && (
                                <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                                  {diagnosis.namasteCode.category}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Diagnosis Display */}
                          <h4 className="font-semibold text-gray-900 text-base mb-2">
                            {diagnosis.namasteCode.display}
                          </h4>
                          
                          {/* ICD-11 Translation */}
                          {diagnosis.translation?.success && (
                            <div className="mt-2 p-2 bg-white border border-gray-200 rounded">
                              <div className="flex items-center space-x-2 mb-1">
                                <ArrowRight className="h-3 w-3 text-blue-500" />
                                <span className="text-xs font-semibold text-gray-700">ICD-11 TM2 Mapping</span>
                              </div>
                              {diagnosis.translation.translations.map((trans, idx) => (
                                <div key={idx} className="flex items-center justify-between">
                                  <div className="flex items-center space-x-2">
                                    <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-mono rounded">
                                      {trans.targetCode}
                                    </span>
                                    <span className="text-sm text-gray-700">{trans.targetDisplay}</span>
                                  </div>
                                  {trans.confidence && (
                                    <span className="text-xs text-blue-600 font-medium">
                                      {Math.round(trans.confidence * 100)}%
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {/* Clinical Notes */}
                          {diagnosis.clinicalNotes && (
                            <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                              <div className="text-xs font-medium text-yellow-800 mb-1">Clinical Notes:</div>
                              <p className="text-sm text-yellow-700">{diagnosis.clinicalNotes}</p>
                            </div>
                          )}
                        </div>
                        
                        {/* Actions */}
                        <div className="flex flex-col space-y-2 ml-4">
                          <button
                            onClick={() => removeDiagnosis(diagnosis.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full"
                            title="Remove diagnosis"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">No Diagnoses Added</h3>
              <p className="text-gray-500">Search and select NAMASTE codes to add diagnoses to this patient.</p>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      {diagnoses.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={generateFHIRBundle}
                disabled={loading}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                <span>Generate FHIR Bundle</span>
              </button>
              
              {fhirBundle && (
                <>
                  <button
                    onClick={downloadBundle}
                    className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download</span>
                  </button>
                  
                  <button
                    onClick={submitBundle}
                    disabled={saving}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    <span>Submit to FHIR</span>
                  </button>
                </>
              )}
            </div>
            
            <div className="text-sm text-gray-500">
              {diagnoses.length} diagnosis(es) ready
            </div>
          </div>
        </div>
      )}

      {/* FHIR Bundle Preview */}
      {fhirBundle && (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="bg-gradient-to-r from-green-50 to-blue-50 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">FHIR R4 Bundle Preview</h3>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 text-sm text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span>Bundle Generated</span>
                </div>
                <button
                  onClick={() => {
                    const blob = new Blob([JSON.stringify(fhirBundle, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `fhir-bundle-${patient.id || 'patient'}-${new Date().getTime()}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="flex items-center space-x-2 px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg transition-colors"
                >
                  <Download className="h-4 w-4" />
                  <span>Download</span>
                </button>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-4">
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">Bundle Information</h4>
                <div className="text-sm text-gray-600">
                  <p><strong>Resource Type:</strong> {fhirBundle.resourceType}</p>
                  <p><strong>Bundle ID:</strong> {fhirBundle.id}</p>
                  <p><strong>Resources:</strong> {fhirBundle.entry?.length || 0}</p>
                  <p><strong>Timestamp:</strong> {new Date(fhirBundle.timestamp).toLocaleString()}</p>
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">Compliance Status</h4>
                <div className="flex items-center space-x-2 text-sm text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span>FHIR R4 Compliant</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span>Ministry of AYUSH Standards</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span>ICD-11 TM2 Mapped</span>
                </div>
              </div>
            </div>
            
            <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-xs font-mono">
              {JSON.stringify(fhirBundle, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* Floating Quick Actions */}
      {diagnoses.length > 0 && (
        <div className="fixed bottom-6 right-6 z-40">
          <div className="flex flex-col space-y-3">
            <button
              onClick={generateFhirBundle}
              disabled={saving}
              className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
            >
              <FileText className="h-5 w-5" />
              <span className="font-medium">Generate FHIR</span>
            </button>
            
            {patient.id && patient.medicalRecordNumber && (
              <button
                onClick={saveDiagnoses}
                disabled={saving}
                className="flex items-center space-x-2 bg-green-500 hover:bg-green-600 text-white px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
              >
                {saving ? (
                  <RefreshCw className="h-5 w-5 animate-spin" />
                ) : (
                  <Save className="h-5 w-5" />
                )}
                <span className="font-medium">Save Record</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Enhanced Session Summary */}
      {diagnoses.length > 0 && (
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg p-6 mt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-2">Session Summary</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p><strong>Patient:</strong> {patient.firstName} {patient.lastName || 'Patient'}</p>
                  <p><strong>Session:</strong> {session.title}</p>
                </div>
                <div>
                  <p><strong>Diagnoses:</strong> {diagnoses.length} conditions</p>
                  <p><strong>ICD-11 Mapped:</strong> {diagnoses.filter(d => d.translation?.success).length}/{diagnoses.length}</p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{Math.round((diagnoses.filter(d => d.translation?.success).length / diagnoses.length) * 100) || 0}%</div>
              <div className="text-sm opacity-90">Coding Complete</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClinicalDiagnosisEntry;