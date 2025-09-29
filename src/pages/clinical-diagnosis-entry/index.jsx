import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import Header from '../../components/ui/Header';
import SearchInput from './components/SearchInput';
import CodeComparisonPanel from './components/CodeComparisonPanel';
import ProblemList from './components/ProblemList';
import PatientContext from './components/PatientContext';
import PatientRecords from './components/PatientRecords';
import Icon from '../../components/AppIcon';
import fhirService from '../../services/fhirService';
import ClinicalDiagnosisEntry from '../../components/ClinicalDiagnosisEntry';
import { useAuth } from '../../contexts/AuthContext';

const ClinicalDiagnosisEntryPage = () => {
  const { isAbhaAuthenticated, user } = useAuth();
  const [selectedTerminology, setSelectedTerminology] = useState(null);
  const [problemList, setProblemList] = useState([]);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [notification, setNotification] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Show welcome message when ABHA is authenticated but keep legacy interface as default
  useEffect(() => {
    if (isAbhaAuthenticated) {
      // Show success notification for ABHA authentication
      setTimeout(() => {
        showNotification('🎉 ABHA Authentication Successful! You now have access to both Legacy and FHIR R4 interfaces.', 'success');
      }, 500);
    }
  }, [isAbhaAuthenticated]);

  // Load saved language preference on component mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('ayush-language') || 'en';
    setCurrentLanguage(savedLanguage);
  }, []);

  // Save language preference when changed
  useEffect(() => {
    localStorage.setItem('ayush-language', currentLanguage);
  }, [currentLanguage]);

  const handleSearch = (searchTerm) => {
    setIsSearchLoading(true);
    // Simulate API call delay
    setTimeout(() => {
      setIsSearchLoading(false);
    }, 300);
  };

  const handleTerminologySelect = (terminology) => {
    setSelectedTerminology(terminology);
    showNotification('Terminology selected for comparison', 'success');
  };

  const handleAddToProblemList = (terminology) => {
    const newProblem = {
      ...terminology,
      id: `problem_${Date.now()}`,
      addedAt: new Date()?.toISOString(),
      addedBy: 'Current User',
      status: terminology?.icd11 ? 'validated' : 'pending'
    };

    setProblemList(prev => [...prev, newProblem]);
    showNotification('Diagnosis added to problem list', 'success');
  };

  const handleRemoveFromProblemList = (problemId) => {
    setProblemList(prev => prev?.filter(p => p?.id !== problemId));
    showNotification('Diagnosis removed from problem list', 'info');
  };

  const handleGenerateFHIR = () => {
    // Mock FHIR Bundle generation
    const fhirBundle = {
      resourceType: 'Bundle',
      id: `bundle_${Date.now()}`,
      type: 'collection',
      timestamp: new Date()?.toISOString(),
      entry: problemList?.map(problem => ({
        resource: {
          resourceType: 'Condition',
          id: problem?.id,
          code: {
            coding: [
              {
                system: 'http://namaste.gov.in/fhir/CodeSystem/ayush-terminology',
                code: problem?.code,
                display: problem?.display
              },
              ...(problem?.icd11 ? [{
                system: 'http://id.who.int/icd/release/11/mms',
                code: problem?.icd11?.code,
                display: problem?.icd11?.display
              }] : [])
            ]
          },
          subject: {
            reference: 'Patient/example'
          },
          recordedDate: problem?.addedAt
        }
      }))
    };

    console.log('Generated FHIR Bundle:', fhirBundle);
    showNotification('FHIR Bundle generated successfully', 'success');
  };

  const handleSaveToRecord = async () => {
    if (!selectedPatient || !selectedPatient.id) {
      showNotification('Please enter patient ID first', 'warning');
      return;
    }
    
    if (!selectedPatient.medical_record_number) {
      showNotification('Please enter medical record number', 'warning');
      return;
    }
    
    if (problemList.length === 0) {
      showNotification('Please add at least one diagnosis to save', 'warning');
      return;
    }
    
    setIsSaving(true);
    
    try {
      // Create FHIR bundle using the fhirService
      const fhirBundle = fhirService.createDiagnosisBundle(problemList, selectedPatient, {
        includePatient: true,
        practitionerId: 'practitioner-example',
        practitionerName: 'Current User'
      });
      
      // Validate bundle before sending
      if (!fhirBundle || !fhirBundle.resourceType || fhirBundle.resourceType !== 'Bundle') {
        console.error('Invalid FHIR bundle created:', fhirBundle);
        throw new Error('Failed to create valid FHIR bundle');
      }
      
      // Log the created bundle
      console.log('Created FHIR Bundle:', fhirBundle);
      
      // Save the bundle to FHIR API
      const fhirResult = await fhirService.saveFhirBundle(fhirBundle);
      console.log('Saved FHIR Bundle to patient record:', fhirResult);
      
      // Create a diagnosis session using the fhirService
      const diagnosisSession = fhirService.createDiagnosisSession(
        selectedPatient, 
        problemList, 
        fhirBundle, 
        {
          title: `Clinical Visit ${new Date().toLocaleDateString()}`,
          chiefComplaint: 'Patient visit for Ayurveda consultation',
          notes: 'Diagnoses recorded via NAMASTE-ICD11 terminology service',
          clinicianName: 'Current User'
        }
      );
      
      // Save the session to our backend
      const result = await fhirService.saveDiagnosisSession(diagnosisSession);
      console.log('Created diagnosis session:', result);
      
      showNotification(`Diagnoses saved with Patient ID: ${selectedPatient.id} and MRN: ${selectedPatient.medical_record_number}`, 'success');
      
      // Reset problem list after successful save
      setProblemList([]);
      
    } catch (error) {
      console.error('Error saving to patient record:', error);
      showNotification('Failed to save diagnoses to patient record', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Language preferences maintained for future use if needed
  

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };



  return (
    <>
      <Helmet>
        <title>Clinical Diagnosis Entry - AYUSH Terminology Service</title>
        <meta name="description" content="Dual-coding interface for AYUSH practitioners to map traditional medicine diagnoses with ICD-11 terminologies" />
      </Helmet>
      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="container mx-auto px-4 py-6 max-w-7xl">


          {/* ABHA Welcome Banner for Legacy Interface */}
          {isAbhaAuthenticated && user && (
            <div className="mb-6 bg-gradient-to-r from-blue-500 to-green-500 text-white rounded-lg p-6">
              <div className="flex items-center space-x-3">
                <Icon name="Shield" size={24} />
                <div>
                  <p className="font-semibold text-lg">Welcome, {user.name}!</p>
                  <p className="text-sm opacity-90">
                    ABHA ID: {user.abha_id} • Legacy Interface with Full FHIR R4 Access • Ministry of AYUSH Compliant
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Page Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-text-primary mb-2">Clinical Diagnosis Entry</h1>
                <p className="text-text-secondary">
                  Search and map NAMASTE codes with ICD-11 terminologies for dual-coding compliance
                </p>
              </div>
              
              <div className="flex items-center space-x-2 text-sm text-text-secondary">
                {isAbhaAuthenticated && (
                  <>
                    <Icon name="Shield" size={16} className="text-blue-600" />
                    <span className="text-blue-600 font-medium">ABHA Authenticated</span>
                    <span className="mx-2">•</span>
                  </>
                )}
                <Icon name="Shield" size={16} className="text-success" />
                <span>FHIR R4 Compliant</span>
                <span className="mx-2">•</span>
                <Icon name="Globe" size={16} className="text-primary" />
                <span>Multi-language Support</span>
              </div>
            </div>
          </div>
          
          {/* Patient Context */}
          <PatientContext 
            patientId={null} 
            onSelectPatient={setSelectedPatient} 
          />

          {/* Notification */}
          {notification && (
            <div className={`mb-6 p-4 rounded-lg border flex items-center space-x-2 ${
              notification?.type === 'success' ? 'bg-success/10 border-success/20 text-success' :
              notification?.type === 'error'? 'bg-error/10 border-error/20 text-error' : 'bg-primary/10 border-primary/20 text-primary'
            }`}>
              <Icon 
                name={
                  notification?.type === 'success' ? 'CheckCircle' :
                  notification?.type === 'error'? 'AlertCircle' : 'Info'
                } 
                size={16} 
              />
              <span className="text-sm font-medium">{notification?.message}</span>
            </div>
          )}

          <div className="grid grid-cols-1 gap-6">
            {/* Main Content Area */}
            <div className="space-y-6">
              {/* Search Section */}
              <div className="bg-card border border-border rounded-lg p-6">
                <SearchInput
                  onSearch={handleSearch}
                  onSelect={handleTerminologySelect}
                  isLoading={isSearchLoading}
                />
              </div>

              {/* Code Comparison Panel */}
              <CodeComparisonPanel
                selectedTerminology={selectedTerminology}
                onAddToProblemList={handleAddToProblemList}
              />

              {/* Problem List */}
              <ProblemList
                problems={problemList}
                onRemove={handleRemoveFromProblemList}
                onGenerateFHIR={handleGenerateFHIR}
                onSaveToRecord={handleSaveToRecord}
                isSaving={isSaving}
                selectedPatient={selectedPatient}
              />
              
              {/* Patient Records - Shows saved diagnoses */}
              {selectedPatient && selectedPatient.id && (
                <PatientRecords 
                  patientId={selectedPatient.id} 
                  medicalRecordNumber={selectedPatient.medical_record_number}
                />
              )}
            </div>
          </div>

          {/* Mobile-specific adaptations */}
          <div className="lg:hidden mt-6">
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center space-x-2 text-sm text-text-secondary mb-2">
                <Icon name="Smartphone" size={16} />
                <span>Mobile Optimized Interface</span>
              </div>
              <p className="text-xs text-text-secondary">
                Swipe between panels for better navigation on mobile devices. 
                All clinical features remain fully accessible.
              </p>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default ClinicalDiagnosisEntryPage;