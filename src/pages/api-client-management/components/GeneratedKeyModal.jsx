import React, { useEffect, useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { cn } from '../../../utils/cn';

const GeneratedKeyModal = ({ credentials, onClose }) => {
  const [copied, setCopied] = useState(false);
  const apiKey = credentials?.apiKey ?? '';
  const keyName = credentials?.keyName ?? 'New API Key';
  const clientName = credentials?.client?.client_name || credentials?.client?.organization || 'API Client';
  const prefix = credentials?.keyInfo?.key_prefix;
  const scopes = credentials?.keyInfo?.scopes || [];
  const expiresAt = credentials?.keyInfo?.expires_at;

  useEffect(() => {
    setCopied(false);
  }, [apiKey]);

  const handleCopy = async () => {
    try {
      await navigator?.clipboard?.writeText(apiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy API key:', err);
      setCopied(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl rounded-xl border border-border bg-card clinical-shadow-lg">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">API key generated</p>
            <h2 className="text-lg font-semibold text-text-primary">{clientName}</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} iconName="X" aria-label="Close modal" />
        </div>

        <div className="space-y-6 px-6 py-6">
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
            <p className="text-sm font-medium text-primary mb-2">Save this key securely. It will not be displayed again.</p>
            <div className="flex items-center justify-between rounded-md bg-background px-3 py-3">
              <div className="flex flex-col">
                <span className="text-xs font-semibold uppercase tracking-wide text-text-secondary">{keyName}</span>
                <code className="mt-1 break-all font-mono text-sm text-text-primary">{apiKey}</code>
              </div>
              <Button variant="outline" size="sm" onClick={handleCopy} iconName={copied ? 'Check' : 'Copy'}>
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">Key prefix</p>
              <p className="mt-1 font-mono text-sm text-text-primary">{prefix || '—'}</p>
            </div>
            <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">Expires</p>
              <p className="mt-1 text-sm text-text-primary">{expiresAt ? new Date(expiresAt).toLocaleString('en-IN') : 'Does not expire'}</p>
            </div>
            <div className={cn('rounded-lg border border-border/60 bg-muted/30 p-3', 'md:col-span-2')}>
              <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">Scopes</p>
              <p className="mt-1 text-sm text-text-primary">{scopes.length > 0 ? scopes.join(', ') : 'terminology:read'}</p>
            </div>
          </div>

          <div className="rounded-lg border border-warning/30 bg-warning/10 p-4">
            <div className="flex items-start gap-3">
              <Icon name="Shield" size={18} className="mt-0.5 text-warning" />
              <p className="text-sm text-warning-foreground">
                Store this key in a secure secret manager. If the key is compromised, revoke it immediately and generate a new one.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-border px-6 py-4">
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
};

export default GeneratedKeyModal;
