import React from 'react';
import Button from '../../../components/ui/Button';

const statusStyles = {
  active: { label: 'Active', classes: 'bg-success/10 text-success border border-success/30' },
  pending: { label: 'Pending', classes: 'bg-warning/10 text-warning border border-warning/30' },
  suspended: { label: 'Suspended', classes: 'bg-error/10 text-error border border-error/30' },
  revoked: { label: 'Revoked', classes: 'bg-muted text-muted-foreground border border-border' }
};

const formatNumber = (value) => {
  if (value === null || value === undefined) return '—';
  return new Intl.NumberFormat('en-IN').format(value);
};

const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
};

const ClientTable = ({ clients = [], onApprove, onGenerateKey, onViewUsage, generatingKeyFor }) => {
  const renderStatus = (status) => {
    const config = statusStyles[status] || statusStyles.pending;
    return (
      <span className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium ${config.classes}`}>
        <span className="h-2 w-2 rounded-full bg-current opacity-75"></span>
        {config.label}
      </span>
    );
  };

  const renderLegacyBadge = (legacy) => {
    if (!legacy) return null;
    return (
      <span className="ml-2 rounded-full border border-secondary/30 bg-secondary/10 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-secondary">
        Legacy
      </span>
    );
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[880px]">
        <thead className="bg-muted/40 text-left text-xs font-semibold uppercase tracking-wide text-onSurface/70">
          <tr>
            <th className="px-4 py-3">Client</th>
            <th className="px-4 py-3">Type</th>
            <th className="px-4 py-3">Email</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Rate Limit / min</th>
            <th className="px-4 py-3">Rate Limit / day</th>
            <th className="px-4 py-3">Registered</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {clients.map((client) => {
            const organization = client.organization || client.client_name || '—';
            const clientType = client.client_type || 'integration';
            const status = client.status || 'pending';
            const perMinute = client.rate_limit_per_minute ?? Math.max(30, Math.round((client.legacy_rate_limit || 3000) / 1440));
            const perDay = client.rate_limit_per_day ?? client.legacy_rate_limit ?? perMinute * 60;

            return (
              <tr key={client.id} className="bg-surface/95">
                <td className="px-4 py-3 align-top">
                  <div className="flex flex-col">
                    <span className="font-medium text-onSurface">{organization}</span>
                    <span className="text-xs text-onSurface/60">ID: {client.id.slice(0, 8)}…</span>
                    {client.legacy_client_key && (
                      <span className="mt-1 inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-[11px] font-mono text-onSurface/70">
                        key: {client.legacy_client_key.slice(0, 12)}…
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 align-top text-onSurface/80">
                  <span className="font-medium capitalize">{clientType}</span>
                  {renderLegacyBadge(client.legacy_schema)}
                </td>
                <td className="px-4 py-3 align-top text-onSurface/70">{client.contact_email || '—'}</td>
                <td className="px-4 py-3 align-top">{renderStatus(status)}</td>
                <td className="px-4 py-3 align-top text-onSurface/80">{formatNumber(perMinute)}</td>
                <td className="px-4 py-3 align-top text-onSurface/80">{formatNumber(perDay)}</td>
                <td className="px-4 py-3 align-top text-onSurface/70">{formatDate(client.created_at)}</td>
                <td className="px-4 py-3 align-top">
                  <div className="flex justify-end gap-2">
                    {status === 'pending' && (
                      <Button
                        size="sm"
                        onClick={() => onApprove?.(client.id)}
                      >
                        Approve
                      </Button>
                    )}
                    {status === 'active' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onGenerateKey?.(client.id)}
                          loading={generatingKeyFor === client.id}
                          disabled={generatingKeyFor && generatingKeyFor !== client.id}
                        >
                          Generate Key
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onViewUsage?.(client.id)}
                        >
                          Usage
                        </Button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}

          {clients.length === 0 && (
            <tr>
              <td colSpan={8} className="px-4 py-10 text-center text-onSurface/60">
                No API clients found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ClientTable;