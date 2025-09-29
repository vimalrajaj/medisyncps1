import React, { useState, useEffect } from 'react';

const PatientContext = ({ patientId, onSelectPatient }) => {
  const [patient, setPatient] = useState({
    id: patientId || '',
    medical_record_number: '',
    first_name: '',
    last_name: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (patientId) {
      setPatient(prevPatient => ({
        ...prevPatient,
        id: patientId
      }));
    }
  }, [patientId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const updatedPatient = {
      ...patient,
      [name]: value
    };
    
    setPatient(updatedPatient);
    
    if (onSelectPatient) {
      onSelectPatient(updatedPatient);
    }
  };

  const resetPatientInfo = () => {
    const resetPatient = {
      id: '',
      medical_record_number: '',
      first_name: '',
      last_name: ''
    };
    
    setPatient(resetPatient);
    
    if (onSelectPatient) {
      onSelectPatient(null);
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4 mb-6 shadow-sm">
      <div>
        <h3 className="text-lg font-medium mb-3">Patient Information</h3>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Patient ID
            </label>
            <input
              type="text"
              name="id"
              className="w-full border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Enter patient ID"
              value={patient.id}
              onChange={handleInputChange}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Medical Record Number
            </label>
            <input
              type="text"
              name="medical_record_number"
              className="w-full border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Enter MRN"
              value={patient.medical_record_number}
              onChange={handleInputChange}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              First Name
            </label>
            <input
              type="text"
              name="first_name"
              className="w-full border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Enter first name"
              value={patient.first_name}
              onChange={handleInputChange}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Last Name
            </label>
            <input
              type="text"
              name="last_name"
              className="w-full border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Enter last name"
              value={patient.last_name}
              onChange={handleInputChange}
            />
          </div>
        </div>
        <div className="flex justify-end">
          <button
            className="text-sm text-text-secondary hover:text-text-primary"
            onClick={resetPatientInfo}
          >
            Reset Information
          </button>
        </div>
      </div>
    </div>
  );
};

export default PatientContext;