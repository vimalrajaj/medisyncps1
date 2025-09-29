import React from 'react';
import Select from '../../../components/ui/Select';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';

const ClientFilters = ({ 
  filters, 
  onFilterChange, 
  onClearFilters = () => {}, 
  resultCount = 0,
  schemaExtended = true
}) => {
  const clientTypeOptions = schemaExtended
    ? [
        { value: 'all', label: 'All Types' },
        { value: 'integration', label: 'System Integration' },
        { value: 'healthcare', label: 'Healthcare Provider' },
        { value: 'research', label: 'Research Platform' },
        { value: 'personal', label: 'Individual Developer' }
      ]
    : [{ value: 'all', label: 'All Types (Legacy Schema)' }];

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'suspended', label: 'Suspended' },
    { value: 'pending', label: 'Pending Approval' },
    { value: 'expired', label: 'Expired' }
  ];

  const usageLevelOptions = [
    { value: 'all', label: 'All Usage Levels' },
    { value: 'low', label: 'Low Usage (< 1K/day)' },
    { value: 'medium', label: 'Medium Usage (1K-10K/day)' },
    { value: 'high', label: 'High Usage (10K-100K/day)' },
    { value: 'enterprise', label: 'Enterprise (> 100K/day)' }
  ];

  return (
    <div className="bg-card border border-border rounded-lg p-6 clinical-shadow mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
        <h3 className="text-lg font-semibold text-text-primary">Filter Clients</h3>
        <div className="text-sm text-text-secondary">
          Showing <span className="font-medium text-text-primary">{resultCount}</span> results
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Input
          type="search"
          placeholder="Search by organization name..."
          value={filters?.search}
          onChange={(e) => onFilterChange('search', e?.target?.value)}
          className="w-full"
        />
        
        <Select
          placeholder="Select client type"
          options={clientTypeOptions}
          value={filters?.clientType}
          onChange={(value) => onFilterChange('clientType', value)}
          disabled={!schemaExtended}
        />
        
        <Select
          placeholder="Select status"
          options={statusOptions}
          value={filters?.status}
          onChange={(value) => onFilterChange('status', value)}
        />
        
        <Select
          placeholder="Select usage level"
          options={usageLevelOptions}
          value={filters?.usageLevel}
          onChange={(value) => onFilterChange('usageLevel', value)}
        />
      </div>
      <div className="flex justify-end mt-4">
        <Button 
          variant="outline" 
          onClick={onClearFilters}
          iconName="X"
          iconPosition="left"
        >
          Clear Filters
        </Button>
      </div>
    </div>
  );
};

export default ClientFilters;