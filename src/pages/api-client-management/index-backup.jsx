import React, { useState, useEffect } from 'react';
import Header from '../../components/Header';
import Button from '../../components/ui/Button';
import ClientStatsCard from './components/ClientStatsCard';
import ClientFilters from './components/ClientFilters';
import ClientTable from './components/ClientTable';
import RegisterClientModal from './components/RegisterClientModal';
import Icon from '../../components/AppIcon';


const ApiClientManagement = () => {
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [filters, setFilters] = useState({
    search: '',
    clientType: 'all',
    status: 'all',
    usageLevel: 'all'
  });
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [stats, setStats] = useState({
    totalClients: 0,
    activeClients: 0,
    totalApiCalls: 0,
    rateLimitAlerts: 0
  });

  // API service functions
  const fetchClients = async () => {
    try {
      const response = await fetch('http://localhost:3002/api/v1/api-clients');
      if (response.ok) {
        const data = await response.json();
        return data.clients || [];
      }
      console.error('Failed to fetch clients:', response.status);
      return [];
    } catch (error) {
      console.error('Error fetching clients:', error);
      return [];
    }
  };

  const loadClientsData = async () => {
    const clientsData = await fetchClients();
    setClients(clientsData);
    setFilteredClients(clientsData);
    
    // Calculate stats from real data
    const totalClients = clientsData?.length || 0;
    const activeClients = clientsData?.filter(client => client?.status === 'active')?.length || 0;
    const totalApiCalls = 0; // We'll add usage data later
    const rateLimitAlerts = clientsData?.filter(client => 
      client?.status === 'pending' || client?.status === 'suspended'
    )?.length || 0;

    setStats({
      totalClients,
      activeClients,
      totalApiCalls,
      rateLimitAlerts
    });
  };

  const registerClient = async (clientData) => {
    try {
      const response = await fetch('http://localhost:3002/api/v1/api-clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(clientData),
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.client;
      }
      console.error('Failed to register client:', response.status);
      return null;
    } catch (error) {
      console.error('Error registering client:', error);
      return null;
    }
  };

  const approveClient = async (clientId) => {
    try {
      const response = await fetch(`http://localhost:3002/api/v1/api-clients/${clientId}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ approved_by: 'System Admin' }),
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.client;
      }
      console.error('Failed to approve client:', response.status);
      return null;
    } catch (error) {
      console.error('Error approving client:', error);
      return null;
    }
  };

  // Load real data on component mount
  useEffect(() => {
    loadClientsData();
  }, []);

  useEffect(() => {
    let filtered = clients;

    // Apply search filter
    if (filters?.search) {
      filtered = filtered?.filter(client =>
        client?.organizationName?.toLowerCase()?.includes(filters?.search?.toLowerCase()) ||
        client?.contactEmail?.toLowerCase()?.includes(filters?.search?.toLowerCase())
      );
    }

    // Apply client type filter
    if (filters?.clientType !== 'all') {
      filtered = filtered?.filter(client => client?.clientType === filters?.clientType);
    }

    // Apply status filter
    if (filters?.status !== 'all') {
      filtered = filtered?.filter(client => client?.status === filters?.status);
    }

    // Apply usage level filter
    if (filters?.usageLevel !== 'all') {
      filtered = filtered?.filter(client => {
        const usage = client?.dailyUsage;
        switch (filters?.usageLevel) {
          case 'low':
            return usage < 1000;
          case 'medium':
            return usage >= 1000 && usage < 10000;
          case 'high':
            return usage >= 10000 && usage < 100000;
          case 'enterprise':
            return usage >= 100000;
          default:
            return true;
        }
      });
    }

    setFilteredClients(filtered);
  }, [clients, filters]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      clientType: 'all',
      status: 'all',
      usageLevel: 'all'
    });
  };

  const handleRegisterClient = (newClient) => {
    setClients(prev => [newClient, ...prev]);
    
    // Update stats
    setStats(prev => ({
      ...prev,
      totalClients: prev?.totalClients + 1
    }));
  };

  const handleRegenerateKey = (clientId) => {
    setClients(prev => prev?.map(client => 
      client?.id === clientId 
        ? { 
            ...client, 
            lastKeyRotation: new Date()?.toLocaleDateString('en-IN'),
            keyExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)?.toLocaleDateString('en-IN')
          }
        : client
    ));
  };

  const handleSuspendClient = (clientId) => {
    setClients(prev => prev?.map(client => 
      client?.id === clientId 
        ? { 
            ...client, 
            status: client?.status === 'active' ? 'suspended' : 'active',
            dailyUsage: client?.status === 'active' ? 0 : client?.dailyUsage
          }
        : client
    ));
  };

  const handleUpdateRateLimit = (clientId, newLimit) => {
    setClients(prev => prev?.map(client => 
      client?.id === clientId 
        ? { ...client, rateLimit: newLimit }
        : client
    ));
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-IN')?.format(num);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-text-primary">API Client Management</h1>
            <p className="text-text-secondary mt-2">
              Manage developer integrations and credential oversight for healthcare IT systems
            </p>
          </div>
          <div className="mt-4 lg:mt-0">
            <Button
              variant="default"
              iconName="Plus"
              iconPosition="left"
              onClick={() => setShowRegisterModal(true)}
            >
              Register New Client
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <ClientStatsCard
            title="Total Clients"
            value={stats?.totalClients}
            change="+2 this month"
            changeType="positive"
            icon="Building2"
            color="primary"
          />
          <ClientStatsCard
            title="Active Clients"
            value={stats?.activeClients}
            change={`${Math.round((stats?.activeClients / stats?.totalClients) * 100)}% active`}
            changeType="positive"
            icon="CheckCircle"
            color="success"
          />
          <ClientStatsCard
            title="Total API Calls"
            value={formatNumber(stats?.totalApiCalls)}
            change="+15% this month"
            changeType="positive"
            icon="BarChart3"
            color="primary"
          />
          <ClientStatsCard
            title="Rate Limit Alerts"
            value={stats?.rateLimitAlerts}
            change={stats?.rateLimitAlerts > 0 ? "Requires attention" : "All within limits"}
            changeType={stats?.rateLimitAlerts > 0 ? "negative" : "positive"}
            icon="AlertTriangle"
            color={stats?.rateLimitAlerts > 0 ? "warning" : "success"}
          />
        </div>

        {/* Filters */}
        <ClientFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
          resultCount={filteredClients?.length}
        />

        {/* Client Table */}
        <ClientTable
          clients={filteredClients}
          onRegenerateKey={handleRegenerateKey}
          onSuspendClient={handleSuspendClient}
          onUpdateRateLimit={handleUpdateRateLimit}
        />

        {/* Empty State */}
        {filteredClients?.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon name="Search" size={24} className="text-text-secondary" />
            </div>
            <h3 className="text-lg font-medium text-text-primary mb-2">No clients found</h3>
            <p className="text-text-secondary mb-4">
              Try adjusting your filters or register a new client to get started.
            </p>
            <Button
              variant="outline"
              iconName="Plus"
              iconPosition="left"
              onClick={() => setShowRegisterModal(true)}
            >
              Register First Client
            </Button>
          </div>
        )}
      </div>
      {/* Register Client Modal */}
      {showRegisterModal && (
        <RegisterClientModal
          onClose={() => setShowRegisterModal(false)}
          onRegister={handleRegisterClient}
        />
      )}
    </div>
  );
};

export default ApiClientManagement;