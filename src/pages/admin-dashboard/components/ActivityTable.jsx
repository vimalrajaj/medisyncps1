import React, { useEffect, useMemo, useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { auditService } from '../../../services/auditService';

const ACTIVITY_TYPE_ICONS = {
  login: 'LogIn',
  logout: 'LogOut',
  search: 'Search',
  diagnosis: 'Stethoscope',
  api_call: 'Network',
  upload: 'Upload',
  consent: 'ShieldCheck',
  default: 'Activity'
};

const STATUS_BADGES = {
  success: 'text-success bg-success/10',
  failure: 'text-destructive bg-destructive/10',
  pending: 'text-warning bg-warning/10'
};

const formatRelativeTime = (value) => {
  if (!value) return '—';
  const timestamp = new Date(value);
  if (Number.isNaN(timestamp.getTime())) {
    return '—';
  }

  const now = Date.now();
  const diffMs = now - timestamp.getTime();

  if (diffMs < 60_000) return 'just now';
  if (diffMs < 3_600_000) {
    const minutes = Math.round(diffMs / 60_000);
    return `${minutes}m ago`;
  }
  if (diffMs < 86_400_000) {
    const hours = Math.round(diffMs / 3_600_000);
    return `${hours}h ago`;
  }

  return timestamp.toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
};

const ActivityTable = () => {
  const [auditLogs, setAuditLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ status: 'all', activityType: 'all' });
  const [searchTerm, setSearchTerm] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');
  const [expandedRow, setExpandedRow] = useState(null);

  const fetchAuditLogs = async (page = pagination.page) => {
    setLoading(true);
    setError(null);

    try {
      const query = {
        page,
        limit: pagination.limit,
        status: filters.status !== 'all' ? filters.status : undefined,
        activityType: filters.activityType !== 'all' ? filters.activityType : undefined,
        search: submittedSearch || undefined
      };

      const response = await auditService.getAuditLogs(query);
      setAuditLogs(response?.data || []);
      setPagination({
        page: response?.pagination?.page || page,
        limit: response?.pagination?.limit || pagination.limit,
        total: response?.pagination?.total || 0,
        pages: response?.pagination?.pages || 0
      });
    } catch (err) {
      setError(err?.message || 'Unable to load audit logs');
      setAuditLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs(1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, submittedSearch]);

  const handleStatusChange = (event) => {
    setFilters((prev) => ({ ...prev, status: event?.target?.value || 'all' }));
  };

  const handleActivityChange = (event) => {
    setFilters((prev) => ({ ...prev, activityType: event?.target?.value || 'all' }));
  };

  const handleSearchSubmit = (event) => {
    event?.preventDefault();
    setSubmittedSearch(searchTerm?.trim());
  };

  const handlePageChange = (direction) => {
    const nextPage = direction === 'next' ? pagination.page + 1 : pagination.page - 1;
    if (nextPage < 1 || (pagination.pages && nextPage > pagination.pages)) return;
    fetchAuditLogs(nextPage);
  };

  const toggleExpandedRow = (id) => {
    setExpandedRow((prev) => (prev === id ? null : id));
  };

  const filterOptions = useMemo(() => ({
    status: [
      { value: 'all', label: 'All statuses' },
      { value: 'success', label: 'Success only' },
      { value: 'failure', label: 'Failures only' }
    ],
    activity: [
      { value: 'all', label: 'All activity' },
      { value: 'login', label: 'Login' },
      { value: 'logout', label: 'Logout' },
      { value: 'search', label: 'Terminology search' },
      { value: 'diagnosis', label: 'Clinical diagnosis' },
      { value: 'api_call', label: 'API access' },
      { value: 'upload', label: 'File uploads' },
      { value: 'consent', label: 'Consent events' }
    ]
  }), []);

  const renderMetadata = (metadata) => {
    if (!metadata || (typeof metadata === 'object' && Object.keys(metadata || {}).length === 0)) {
      return <span className="text-sm text-text-secondary">No additional metadata captured</span>;
    }

    if (typeof metadata === 'string') {
      return <code className="text-xs bg-muted px-2 py-1 rounded">{metadata}</code>;
    }

    return (
      <pre className="text-xs bg-muted rounded p-3 whitespace-pre-wrap break-all">
        {JSON.stringify(metadata, null, 2)}
      </pre>
    );
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6 clinical-shadow">
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 mb-6">
        <div className="flex items-center space-x-2">
          <Icon name="Activity" size={20} className="text-primary" />
          <div>
            <h3 className="text-lg font-semibold text-text-primary">Compliance Audit Trail</h3>
            <p className="text-sm text-text-secondary">
              Live feed of all high-sensitivity actions captured from Supabase activity logs
            </p>
          </div>
        </div>

        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <Input
            type="text"
            placeholder="Search user, resource or description"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event?.target?.value)}
            className="sm:w-72"
          />
          <div className="flex gap-3">
            <select
              value={filters.activityType}
              onChange={handleActivityChange}
              className="px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {filterOptions.activity.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              value={filters.status}
              onChange={handleStatusChange}
              className="px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {filterOptions.status.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <Button type="submit" variant="primary" size="sm" iconName="Search">
              Search
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              iconName="RefreshCw"
              onClick={() => fetchAuditLogs(1)}
            >
              Refresh
            </Button>
          </div>
        </form>
      </div>

      {error && (
        <div className="mb-4 p-4 border border-destructive/40 bg-destructive/10 rounded-lg text-destructive text-sm">
          {error}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/60 text-xs uppercase text-text-secondary">
              <th className="text-left py-3 px-4 font-medium">User</th>
              <th className="text-left py-3 px-4 font-medium">Activity</th>
              <th className="text-left py-3 px-4 font-medium">Resource</th>
              <th className="text-left py-3 px-4 font-medium">Captured</th>
              <th className="text-left py-3 px-4 font-medium">Status</th>
              <th className="text-left py-3 px-4 font-medium">Details</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="py-6 text-center text-text-secondary">
                  <div className="flex items-center justify-center gap-3">
                    <div className="h-4 w-4 border-2 border-border border-t-primary rounded-full animate-spin" />
                    <span>Loading audit trail…</span>
                  </div>
                </td>
              </tr>
            )}

            {!loading && auditLogs?.length === 0 && (
              <tr>
                <td colSpan={6} className="py-6 text-center text-text-secondary">
                  No audit records match the current filters.
                </td>
              </tr>
            )}

            {!loading && auditLogs?.map((log) => {
              const successState = log?.success === false ? 'failure' : 'success';
              const badgeClass = STATUS_BADGES[successState] || STATUS_BADGES.success;
              const iconName = ACTIVITY_TYPE_ICONS[log?.activity_type] || ACTIVITY_TYPE_ICONS.default;

              return (
                <React.Fragment key={log?.id}>
                  <tr className="border-b border-border/60 hover:bg-muted/40 clinical-transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center">
                          <Icon name="User" size={16} className="text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-text-primary">
                            {log?.user_name || log?.user_id || 'System'}
                          </p>
                          {log?.ip_address && (
                            <p className="text-xs text-text-secondary">IP: {log?.ip_address}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Icon name={iconName} size={16} className="text-text-secondary" />
                        <div>
                          <p className="text-sm text-text-primary capitalize">{log?.activity_type || 'activity'}</p>
                          <p className="text-xs text-text-secondary line-clamp-2">{log?.activity_description || '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm text-text-secondary">
                        <p className="font-medium text-text-primary capitalize">{log?.resource_type || '—'}</p>
                        {log?.resource_id && <p className="text-xs">{log?.resource_id}</p>}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-text-secondary">
                      {formatRelativeTime(log?.created_at)}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${badgeClass}`}>
                        {successState}
                      </span>
                      {log?.error_message && (
                        <p className="text-xs text-destructive mt-1 max-w-xs line-clamp-2">{log?.error_message}</p>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        iconName={expandedRow === log?.id ? 'ChevronUp' : 'Eye'}
                        onClick={() => toggleExpandedRow(log?.id)}
                      >
                        {expandedRow === log?.id ? 'Hide' : 'Inspect'}
                      </Button>
                    </td>
                  </tr>
                  {expandedRow === log?.id && (
                    <tr className="bg-muted/40 border-b border-border/60">
                      <td colSpan={6} className="p-5">
                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <h4 className="text-sm font-semibold text-text-primary mb-2">Request Context</h4>
                            <div className="text-xs text-text-secondary space-y-1">
                              <p><span className="font-medium">User agent:</span> {log?.user_agent || '—'}</p>
                              <p><span className="font-medium">Recorded at:</span> {new Date(log?.created_at).toLocaleString()}</p>
                            </div>
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-text-primary mb-2">Metadata</h4>
                            {renderMetadata(log?.metadata)}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 pt-4 border-t border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <span className="text-sm text-text-secondary">
          Showing page {pagination.page} of {pagination.pages || 1}. Total records: {pagination.total}.
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            iconName="ChevronLeft"
            onClick={() => handlePageChange('previous')}
            disabled={pagination.page <= 1 || loading}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            iconName="ChevronRight"
            onClick={() => handlePageChange('next')}
            disabled={loading || (pagination.pages !== 0 && pagination.page >= pagination.pages)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ActivityTable;