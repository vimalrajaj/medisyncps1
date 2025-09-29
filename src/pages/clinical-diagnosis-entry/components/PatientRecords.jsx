import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import fhirService from '../../../services/fhirService';
import FhirBundleViewer from '../../../components/FhirBundleViewer';

const PatientRecords = ({ patientId, medicalRecordNumber }) => {
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);
  const [viewingFhir, setViewingFhir] = useState(false);

  useEffect(() => {
    if (medicalRecordNumber) {
      fetchPatientRecords();
    } else {
      setRecords([]);
    }
  }, [medicalRecordNumber]);

  const fetchPatientRecords = async () => {
    if (!medicalRecordNumber) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // First, fetch the actual patient by medical record number
      console.log('Fetching records for MRN:', medicalRecordNumber);
      
      const response = await fetch(`/api/v1/patients?search=${medicalRecordNumber}`);
      if (!response.ok) {
        throw new Error('Failed to find patient');
      }
      
      const patientsData = await response.json();
      const patient = patientsData.patients?.find(p => p.medical_record_number === medicalRecordNumber);
      
      if (!patient) {
        console.log('No patient found with MRN:', medicalRecordNumber);
        setRecords([]);
        return;
      }
      
      console.log('Found patient:', patient.id, 'for MRN:', medicalRecordNumber);
      
      // Now fetch the diagnosis history using the real patient ID
      const data = await fhirService.getPatientDiagnosisHistory(patient.id);
      
      if (data && data.sessions) {
        console.log('Found diagnosis sessions:', data.sessions.length);
        setRecords(data.sessions);
      } else {
        console.log('No diagnosis sessions found');
        setRecords([]);
      }
    } catch (err) {
      console.error('Error fetching patient records:', err);
      setError('Failed to fetch patient records');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (!medicalRecordNumber) {
    return null;
  }

  const handleViewFhir = (session) => {
    setSelectedSession(session);
    setViewingFhir(true);
  };

  const handleCloseModal = () => {
    setSelectedSession(null);
    setViewingFhir(false);
  };

  return (
    <div className="bg-card border border-border rounded-lg mt-6">
      <div className="bg-muted px-6 py-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Icon name="FileText" size={20} className="text-text-secondary" />
            <h3 className="text-lg font-semibold text-text-primary">Patient Records</h3>
            <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded">
              {records.length} {records.length === 1 ? 'session' : 'sessions'}
            </span>
            {(patientId || medicalRecordNumber) && (
              <div className="flex items-center space-x-2 text-sm text-text-secondary">
                <span>•</span>
                <Icon name="User" size={14} />
                <span>Patient ID: {patientId}</span>
                {medicalRecordNumber && (
                  <span className="text-xs">MRN: {medicalRecordNumber}</span>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchPatientRecords}
              iconName="RefreshCw"
            >
              Refresh
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Icon name="Loader" size={24} className="animate-spin text-primary" />
            <span className="ml-2 text-text-secondary">Loading records...</span>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-error">
            <Icon name="AlertCircle" size={24} className="mx-auto mb-2" />
            <p>{error}</p>
          </div>
        ) : records.length === 0 ? (
          <div className="text-center py-8">
            <Icon name="Inbox" size={48} className="mx-auto mb-4 text-text-secondary opacity-50" />
            <h4 className="text-lg font-medium text-text-primary mb-2">No Records Found</h4>
            <p className="text-text-secondary">
              {patientId ? 'This patient has no diagnosis records yet.' : 'Select a patient to view records'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {records.map((session) => (
              <div key={session.id} className="border border-border rounded-lg overflow-hidden">
                <div className="bg-muted px-4 py-3 border-b border-border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <h5 className="font-medium text-text-primary">{session.session_title}</h5>
                      <span className="text-xs text-text-secondary">{formatDate(session.created_at)}</span>
                    </div>
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                      {session.diagnosis_entries?.length || 0} diagnoses
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  {session.diagnosis_entries && session.diagnosis_entries.length > 0 ? (
                    <div className="space-y-3">
                      {session.diagnosis_entries.map((entry) => (
                        <div key={entry.id} className="flex items-start p-2 hover:bg-muted/30 rounded-lg">
                          <div className="w-8 h-8 flex items-center justify-center bg-primary/10 text-primary rounded-full mr-3">
                            <Icon name="File" size={16} />
                          </div>
                          <div>
                            <div className="flex items-center mb-1">
                              <h6 className="font-medium text-text-primary">{entry.namaste_display}</h6>
                              <span className="ml-2 font-mono text-xs bg-muted px-2 py-0.5 rounded text-text-secondary">
                                {entry.namaste_code}
                              </span>
                            </div>
                            
                            {entry.icd11_code && (
                              <div className="flex items-center text-xs text-text-secondary mb-1">
                                <span className="font-medium mr-1">ICD-11:</span>
                                <span className="font-mono mr-1">{entry.icd11_code}</span> - {entry.icd11_display}
                              </div>
                            )}

                            {entry.clinical_notes && (
                              <p className="text-xs text-text-secondary mt-1">
                                {entry.clinical_notes}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-text-secondary">No diagnoses recorded in this session</p>
                  )}

                  {session.clinical_notes && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <p className="text-sm text-text-secondary">
                        <span className="font-medium">Notes:</span> {session.clinical_notes}
                      </p>
                    </div>
                  )}
                </div>
                <div className="bg-muted px-4 py-2 text-xs text-text-secondary border-t border-border">
                  <div className="flex items-center justify-between">
                    <span>Recorded by {session.clinician_name}</span>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <Icon name="Code" size={12} />
                        <span>{session.total_codes} codes</span>
                      </div>
                      <button 
                        className="text-primary hover:underline"
                        onClick={() => handleViewFhir(session)}
                      >
                        View FHIR Bundle
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FHIR Bundle Modal */}
      {viewingFhir && selectedSession && (
        <FhirBundleViewer
          bundle={selectedSession.fhir_bundle}
          isOpen={viewingFhir}
          onClose={handleCloseModal}
          sessionInfo={{
            title: selectedSession.session_title,
            patient_id: selectedSession.patient_id,
            created_at: formatDate(selectedSession.created_at),
            total_codes: selectedSession.total_codes,
            chief_complaint: selectedSession.chief_complaint,
            clinician_name: selectedSession.clinician_name
          }}
          diagnoses={selectedSession.diagnosis_entries}
        />
      )}
    </div>
  );
};

export default PatientRecords;