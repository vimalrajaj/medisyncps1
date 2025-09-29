import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import { Checkbox } from '../../../components/ui/Checkbox';

const RegisterClientModal = ({ onClose, onRegister }) => {
  const [formData, setFormData] = useState({
    organizationName: '',
    contactEmail: '',
    primaryContact: '',
    phone: '',
    address: '',
    clientType: 'integration',
    intendedUsage: '',
    expectedVolume: 'low',
    fhirCompliance: false,
    termsAccepted: false
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const clientTypeOptions = [
    { value: 'integration', label: 'System Integration', description: 'Healthcare system or middleware integration' },
    { value: 'healthcare', label: 'Healthcare Provider', description: 'Hospitals, clinics, EMR systems' },
    { value: 'research', label: 'Research Platform', description: 'Academic or clinical research initiatives' },
    { value: 'personal', label: 'Individual Developer', description: 'Personal or prototype usage' }
  ];

  const volumeOptions = [
    { value: 'low', label: 'Low Volume (< 1K requests/day)' },
    { value: 'medium', label: 'Medium Volume (1K-10K requests/day)' },
    { value: 'high', label: 'High Volume (10K-100K requests/day)' },
    { value: 'enterprise', label: 'Enterprise Volume (> 100K requests/day)' }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors?.[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData?.organizationName?.trim()) {
      newErrors.organizationName = 'Organization name is required';
    }

    if (!formData?.contactEmail?.trim()) {
      newErrors.contactEmail = 'Contact email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/?.test(formData?.contactEmail)) {
      newErrors.contactEmail = 'Please enter a valid email address';
    }

    if (!formData?.primaryContact?.trim()) {
      newErrors.primaryContact = 'Primary contact name is required';
    }

    if (!formData?.phone?.trim()) {
      newErrors.phone = 'Phone number is required';
    }

    if (!formData?.clientType) {
      newErrors.clientType = 'Please select a client type';
    }

    if (!formData?.expectedVolume) {
      newErrors.expectedVolume = 'Please select expected volume';
    }

    if (!formData?.intendedUsage?.trim()) {
      newErrors.intendedUsage = 'Please describe the intended usage';
    }

    if (!formData?.fhirCompliance) {
      newErrors.fhirCompliance = 'FHIR compliance acknowledgment is required';
    }

    if (!formData?.termsAccepted) {
      newErrors.termsAccepted = 'You must accept the terms and conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors)?.length === 0;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');
    
    try {
      const payload = {
        client_name: formData?.organizationName?.trim(),
        client_type: formData?.clientType,
        organization: formData?.organizationName?.trim(),
        contact_email: formData?.contactEmail?.trim(),
        contact_phone: formData?.phone?.trim(),
        description: formData?.intendedUsage?.trim(),
        expected_volume: formData?.expectedVolume,
        primary_contact: formData?.primaryContact?.trim(),
        address: formData?.address?.trim(),
        intended_usage: formData?.intendedUsage?.trim(),
        fhir_compliance: formData?.fhirCompliance,
        terms_accepted: formData?.termsAccepted
      };

      const savedClient = await onRegister(payload);

      if (!savedClient) {
        setSubmitError('Registration failed. Please try again.');
        return;
      }

      onClose();
    } catch (error) {
      console.error('Registration failed:', error);
      setSubmitError('Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-lg clinical-shadow max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Icon name="Plus" size={20} color="white" />
            </div>
            <h2 className="text-xl font-semibold text-text-primary">Register New API Client</h2>
          </div>
          <Button variant="ghost" size="sm" iconName="X" onClick={onClose} />
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Organization Information */}
          <div>
            <h3 className="text-lg font-semibold text-text-primary mb-4">Organization Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Organization Name"
                type="text"
                placeholder="Enter organization name"
                value={formData?.organizationName}
                onChange={(e) => handleInputChange('organizationName', e?.target?.value)}
                error={errors?.organizationName}
                required
              />
              
              <Input
                label="Contact Email"
                type="email"
                placeholder="contact@organization.com"
                value={formData?.contactEmail}
                onChange={(e) => handleInputChange('contactEmail', e?.target?.value)}
                error={errors?.contactEmail}
                required
              />
              
              <Input
                label="Primary Contact"
                type="text"
                placeholder="Contact person name"
                value={formData?.primaryContact}
                onChange={(e) => handleInputChange('primaryContact', e?.target?.value)}
                error={errors?.primaryContact}
                required
              />
              
              <Input
                label="Phone Number"
                type="tel"
                placeholder="+91 98765 43210"
                value={formData?.phone}
                onChange={(e) => handleInputChange('phone', e?.target?.value)}
                error={errors?.phone}
                required
              />
            </div>
            
            <div className="mt-4">
              <Input
                label="Address"
                type="text"
                placeholder="Complete organization address"
                value={formData?.address}
                onChange={(e) => handleInputChange('address', e?.target?.value)}
                error={errors?.address}
              />
            </div>
          </div>

          {/* Technical Information */}
          <div>
            <h3 className="text-lg font-semibold text-text-primary mb-4">Technical Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Client Type"
                placeholder="Select client type"
                options={clientTypeOptions}
                value={formData?.clientType}
                onChange={(value) => handleInputChange('clientType', value)}
                error={errors?.clientType}
                required
              />
              
              <Select
                label="Expected API Volume"
                placeholder="Select expected volume"
                options={volumeOptions}
                value={formData?.expectedVolume}
                onChange={(value) => handleInputChange('expectedVolume', value)}
                error={errors?.expectedVolume}
                required
              />
            </div>
          </div>

          {/* Usage Description */}
          <div>
            <h3 className="text-lg font-semibold text-text-primary mb-4">Usage Details</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Intended Usage Description *
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                  rows="4"
                  placeholder="Describe how you plan to use the AYUSH Terminology Service API..."
                  value={formData?.intendedUsage}
                  onChange={(e) => handleInputChange('intendedUsage', e?.target?.value)}
                />
                {errors?.intendedUsage && (
                  <p className="text-sm text-error mt-1">{errors?.intendedUsage}</p>
                )}
              </div>
            </div>
          </div>

          {/* Compliance & Terms */}
          <div>
            <h3 className="text-lg font-semibold text-text-primary mb-4">Compliance & Terms</h3>
            <div className="space-y-4">
              <Checkbox
                label="FHIR R4 Compliance Acknowledgment"
                description="I acknowledge that our system will comply with FHIR R4 standards and implement proper error handling for API responses."
                checked={formData?.fhirCompliance}
                onChange={(e) => handleInputChange('fhirCompliance', e?.target?.checked)}
                error={errors?.fhirCompliance}
              />
              
              <Checkbox
                label="Terms and Conditions"
                description="I accept the AYUSH Terminology Service API terms of use, privacy policy, and agree to comply with all usage guidelines and rate limits."
                checked={formData?.termsAccepted}
                onChange={(e) => handleInputChange('termsAccepted', e?.target?.checked)}
                error={errors?.termsAccepted}
              />
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="default"
              loading={isSubmitting}
              iconName="Plus"
              iconPosition="left"
              className="flex-1"
            >
              Register Client
            </Button>
          </div>
        </form>

        {submitError && (
          <div className="px-6 pb-6 -mt-4">
            <div className="text-sm text-error bg-error/10 border border-error/20 rounded-lg px-4 py-3">
              {submitError}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RegisterClientModal;