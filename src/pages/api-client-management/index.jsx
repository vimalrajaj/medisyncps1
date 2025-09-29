import React, { useState, useEffect } from 'react';
import Header from '../../components/ui/Header';
import Button from '../../components/ui/Button';
import ClientStatsCard from './components/ClientStatsCard';
import ClientFilters from './components/ClientFilters';
import ClientTable from './components/ClientTable';
import RegisterClientModal from './components/RegisterClientModal';
import GeneratedKeyModal from './components/GeneratedKeyModal';
import Icon from '../../components/AppIcon';
import { resolveApiUrl } from '../../config/api';

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
  const [loading, setLoading] = useState(true);
  const [schemaInfo, setSchemaInfo] = useState({ extended: true });
  const [generatingKeyFor, setGeneratingKeyFor] = useState(null);
  const [generatedCredentials, setGeneratedCredentials] = useState(null);
  const [showGeneratedKeyModal, setShowGeneratedKeyModal] = useState(false);
  const [keyError, setKeyError] = useState('');

  // API service functions
  const fetchClients = async () => {
    try {
      const response = await fetch(resolveApiUrl('/api/v1/api-clients'));
      if (response.ok) {
        const data = await response.json();
        return {
          clients: data.clients || [],
          schema: data.schema || { extended: true }
        };
      }
      console.error('Failed to fetch clients:', response.status);
      return { clients: [], schema: { extended: true } };
    } catch (error) {
      console.error('Error fetching clients:', error);
      return { clients: [], schema: { extended: true } };
    }
  };

  const registerClient = async (clientData) => {
    try {
      const response = await fetch(resolveApiUrl('/api/v1/api-clients'), {
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
      const response = await fetch(resolveApiUrl(`/api/v1/api-clients/${clientId}/approve`), {
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

  const loadClientsData = async () => {
    setLoading(true);
    const { clients: clientsData, schema } = await fetchClients();
    setClients(clientsData);
    setFilteredClients(clientsData);
    setSchemaInfo(schema);

    if (!schema?.extended) {
      setFilters(prev => ({
        ...prev,
        clientType: 'all'
      }));
    }
    
    // Calculate stats from real data
    const totalClients = clientsData?.length || 0;
    const activeClients = clientsData?.filter(client => client?.status === 'active')?.length || 0;
    const pendingClients = clientsData?.filter(client => client?.status === 'pending')?.length || 0;
    const suspendedClients = clientsData?.filter(client => client?.status === 'suspended')?.length || 0;

    setStats({
      totalClients,
      activeClients,
      totalApiCalls: 0, // We'll add usage tracking later
      rateLimitAlerts: pendingClients + suspendedClients
    });
    setLoading(false);
  };

  // Handle client registration
  const handleRegisterClient = async (clientData) => {
    const newClient = await registerClient(clientData);
    if (newClient) {
      await loadClientsData(); // Refresh the list
      setShowRegisterModal(false);
    }
  };

  // Handle client approval
  const handleApproveClient = async (clientId) => {
    const approvedClient = await approveClient(clientId);
    if (approvedClient) {
      await loadClientsData(); // Refresh the list
    }
  };

  const handleGenerateKey = async (clientId) => {
    setKeyError('');
    setGeneratingKeyFor(clientId);

    const client = clients.find((c) => c.id === clientId) || null;
    const keyName = `Primary Key ${new Date().toLocaleDateString('en-IN')}`;

    try {
      const response = await fetch(resolveApiUrl(`/api/v1/api-clients/${clientId}/keys`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          key_name: keyName,
          scopes: ['terminology:read'],
          expires_in_days: null
        })
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to generate API key');
      }

      setGeneratedCredentials({
        apiKey: payload.api_key,
        keyInfo: payload.key_info,
        keyName,
        client
      });
      setShowGeneratedKeyModal(true);
    } catch (error) {
      console.error('Error generating API key:', error);
      setKeyError(error.message || 'Failed to generate API key. Please try again.');
    } finally {
      setGeneratingKeyFor(null);
    }
  };

  // Filter clients based on search and filters
  useEffect(() => {
    let filtered = clients;

    // Search filter
    if (filters.search) {
      filtered = filtered.filter(client =>
        client.client_name?.toLowerCase().includes(filters.search.toLowerCase()) ||
        client.organization?.toLowerCase().includes(filters.search.toLowerCase()) ||
        client.contact_email?.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    // Client type filter
    if (schemaInfo?.extended && filters.clientType !== 'all') {
      filtered = filtered.filter(client => client.client_type === filters.clientType);
    }

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(client => client.status === filters.status);
    }

    setFilteredClients(filtered);
  }, [clients, filters]);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      clientType: 'all',
      status: 'all',
      usageLevel: 'all'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-onBackground/70">Loading API clients...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-onBackground mb-2">
              API Client Management
            </h1>
            <p className="text-onBackground/70">
              Manage API access, monitor usage, and maintain client relationships
            </p>
          </div>
          
          <Button
            onClick={() => setShowRegisterModal(true)}
            className="mt-4 sm:mt-0 flex items-center gap-2"
          >
            <Icon name="plus" size={20} />
            Register New Client
          </Button>
        </div>

        {!schemaInfo?.extended && (
          <div className="mb-6">
            <div className="rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-warning-foreground">
              <p className="font-medium">Legacy schema detected</p>
              <p className="mt-1 text-warning-foreground/80">
                The Supabase <code className="px-1 py-0.5 rounded bg-warning/20">api_clients</code> table is using an older structure. Some advanced filtering (client type, usage analytics) is disabled until the latest database migration is applied.
              </p>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <ClientStatsCard
            title="Total Clients"
            value={stats.totalClients}
            icon="users"
            trend="+12%"
            trendDirection="up"
          />
          <ClientStatsCard
            title="Active Clients"
            value={stats.activeClients}
            icon="check-circle"
            trend="+8%"
            trendDirection="up"
          />
          <ClientStatsCard
            title="API Calls (30d)"
            value={stats.totalApiCalls.toLocaleString()}
            icon="activity"
            trend="+15%"
            trendDirection="up"
          />
          <ClientStatsCard
            title="Alerts"
            value={stats.rateLimitAlerts}
            icon="alert-triangle"
            trend={stats.rateLimitAlerts > 0 ? "Attention" : "All Clear"}
            trendDirection={stats.rateLimitAlerts > 0 ? "down" : "up"}
          />
        </div>

        {/* Filters */}
        <div className="mb-6">
          <ClientFilters
            filters={filters}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
            resultCount={filteredClients.length}
            schemaExtended={schemaInfo?.extended}
          />
        </div>

        {keyError && (
          <div className="mb-6 rounded-lg border border-error/20 bg-error/10 px-4 py-3 text-sm text-error">
            {keyError}
          </div>
        )}

        {/* Clients Table */}
        <div className="bg-surface rounded-xl shadow-lg border border-outline/20">
          <div className="p-6 border-b border-outline/20">
            <h2 className="text-xl font-semibold text-onSurface">
              API Clients ({filteredClients.length})
            </h2>
          </div>
          
          <ClientTable 
            clients={filteredClients}
            onApprove={handleApproveClient}
            onGenerateKey={handleGenerateKey}
            generatingKeyFor={generatingKeyFor}
            onViewUsage={(clientId) => {
              console.log('View usage for:', clientId);
            }}
          />
        </div>

        {/* Empty State */}
        {filteredClients.length === 0 && !loading && (
          <div className="text-center py-12">
            <Icon name="users" size={48} className="mx-auto mb-4 text-onBackground/40" />
            <h3 className="text-lg font-medium text-onBackground mb-2">
              No API clients found
            </h3>
            <p className="text-onBackground/70 mb-4">
              {clients.length === 0 
                ? "Get started by registering your first API client."
                : "Try adjusting your filters to see more results."
              }
            </p>
            {clients.length === 0 && (
              <Button onClick={() => setShowRegisterModal(true)}>
                Register First Client
              </Button>
            )}
          </div>
        )}
      </main>

      {/* Register Client Modal */}
      {showRegisterModal && (
        <RegisterClientModal
          onClose={() => setShowRegisterModal(false)}
          onRegister={handleRegisterClient}
        />
      )}

      {showGeneratedKeyModal && generatedCredentials && (
        <GeneratedKeyModal
          credentials={generatedCredentials}
          onClose={() => {
            setShowGeneratedKeyModal(false);
            setGeneratedCredentials(null);
          }}
        />
      )}
    </div>
  );
};

export default ApiClientManagement;