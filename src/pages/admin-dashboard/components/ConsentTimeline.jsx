import React, { useEffect, useMemo, useState } from "react";
import Icon from "../../../components/AppIcon";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import { auditService } from "../../../services/auditService";

const CONSENT_STATUS_BADGES = {
  granted: "text-success bg-success/10 border-success/40",
  withdrawn: "text-destructive bg-destructive/10 border-destructive/40",
  expired: "text-warning bg-warning/10 border-warning/40"
};

const formatDateTime = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
};

const ConsentTimeline = () => {
  const [records, setRecords] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });
  const [filters, setFilters] = useState({ consentStatus: "all", consentType: "all" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formState, setFormState] = useState({
    patientMrn: "",
    consentType: "fhir_export",
    consentStatus: "granted",
    consentVersion: "",
    consentScope: "",
    effectiveFrom: "",
    effectiveUntil: "",
    evidenceUrl: "",
    notes: ""
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formMessage, setFormMessage] = useState(null);

  const loadConsentRecords = async (page = pagination.page) => {
    setLoading(true);
    setError(null);

    try {
      const query = {
        page,
        limit: pagination.limit,
        consentStatus: filters.consentStatus !== "all" ? filters.consentStatus : undefined,
        consentType: filters.consentType !== "all" ? filters.consentType : undefined
      };

      const response = await auditService.getConsentRecords(query);
      setRecords(response?.data || []);
      setPagination({
        page: response?.pagination?.page || page,
        limit: response?.pagination?.limit || pagination.limit,
        total: response?.pagination?.total || 0,
        pages: response?.pagination?.pages || 0
      });
    } catch (err) {
      setError(err?.message || "Unable to load consent records");
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConsentRecords(1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const statusOptions = useMemo(() => ([
    { value: "all", label: "All statuses" },
    { value: "granted", label: "Granted" },
    { value: "withdrawn", label: "Withdrawn" },
    { value: "expired", label: "Expired" }
  ]), []);

  const typeOptions = useMemo(() => ([
    { value: "all", label: "All consent types" },
    { value: "fhir_export", label: "FHIR bundle export" },
    { value: "data_sharing", label: "Data sharing" },
    { value: "terminology_upload", label: "Terminology upload" }
  ]), []);

  const handlePageChange = (direction) => {
    const nextPage = direction === "next" ? pagination.page + 1 : pagination.page - 1;
    if (nextPage < 1 || (pagination.pages && nextPage > pagination.pages)) return;
    loadConsentRecords(nextPage);
  };

  const handleInputChange = (field) => (event) => {
    setFormState((prev) => ({
      ...prev,
      [field]: event?.target?.value
    }));
  };

  const handleRecordConsent = async (event) => {
    event?.preventDefault();
    setFormSubmitting(true);
    setFormMessage(null);

    try {
      const payload = {
        patientMrn: formState.patientMrn?.trim() || undefined,
        consentType: formState.consentType,
        consentStatus: formState.consentStatus,
        consentVersion: formState.consentVersion?.trim() || undefined,
        consentScope: formState.consentScope?.trim() || undefined,
        evidenceUrl: formState.evidenceUrl?.trim() || undefined,
        effectiveFrom: formState.effectiveFrom || undefined,
        effectiveUntil: formState.effectiveUntil || undefined,
        metadata: formState.notes?.trim() ? { notes: formState.notes.trim() } : undefined
      };

      await auditService.createConsentRecord(payload);
      setFormMessage({ type: "success", text: "Consent record captured successfully." });
      setFormState((prev) => ({
        ...prev,
        consentVersion: "",
        consentScope: "",
        effectiveFrom: "",
        effectiveUntil: "",
        evidenceUrl: "",
        notes: ""
      }));
      loadConsentRecords(1);
    } catch (err) {
      setFormMessage({ type: "error", text: err?.message || "Failed to record consent" });
    } finally {
      setFormSubmitting(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6 clinical-shadow">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Icon name="Shield" size={20} className="text-primary" />
          <div>
            <h3 className="text-lg font-semibold text-text-primary">Patient Consent Ledger</h3>
            <p className="text-sm text-text-secondary">
              Track consent grant, withdrawal, and expiry events mapped to patient MRNs.
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={filters.consentType}
            onChange={(event) => setFilters((prev) => ({ ...prev, consentType: event?.target?.value }))}
            className="px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {typeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            value={filters.consentStatus}
            onChange={(event) => setFilters((prev) => ({ ...prev, consentStatus: event?.target?.value }))}
            className="px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 border border-destructive/40 bg-destructive/10 rounded-lg text-destructive text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
        <div className="space-y-4">
          {loading && (
            <div className="border border-border rounded-lg p-4 flex items-center justify-center text-sm text-text-secondary">
              <div className="h-4 w-4 border-2 border-border border-t-primary rounded-full animate-spin mr-3" />
              Loading consent history…
            </div>
          )}

          {!loading && records?.length === 0 && (
            <div className="border border-dashed border-border rounded-lg p-6 text-center text-sm text-text-secondary">
              No consent entries match the current filters.
            </div>
          )}

          {!loading && records?.map((record) => {
            const badge = CONSENT_STATUS_BADGES[record?.consent_status] || CONSENT_STATUS_BADGES.granted;
            const patientLabel = record?.patient?.medical_record_number
              ? `${record?.patient?.medical_record_number} · ${record?.patient?.first_name || ''} ${record?.patient?.last_name || ''}`.trim()
              : 'Unlinked Patient';

            return (
              <div
                key={record?.id}
                className="border border-border rounded-lg p-4 clinical-transition hover:border-primary/60"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Icon name="ClipboardSignature" size={16} className="text-text-secondary" />
                      <span className="text-sm font-semibold text-text-primary capitalize">
                        {record?.consent_type?.replace(/_/g, ' ') || 'Consent record'}
                      </span>
                    </div>
                    <p className="text-xs text-text-secondary">Patient: {patientLabel}</p>
                    {record?.consent_scope && (
                      <p className="text-sm text-text-secondary mt-2 line-clamp-3">
                        {record?.consent_scope}
                      </p>
                    )}
                  </div>
                  <span className={`px-2 py-1 border rounded-full text-xs font-medium capitalize ${badge}`}>
                    {record?.consent_status || 'granted'}
                  </span>
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-3 text-xs text-text-secondary">
                  <div>
                    <p className="font-medium text-text-primary">Effective from</p>
                    <p>{formatDateTime(record?.effective_from)}</p>
                  </div>
                  <div>
                    <p className="font-medium text-text-primary">Valid until</p>
                    <p>{formatDateTime(record?.effective_until)}</p>
                  </div>
                  <div>
                    <p className="font-medium text-text-primary">Recorded by</p>
                    <p>{record?.recorded_by || 'System automation'}</p>
                  </div>
                </div>
                {record?.metadata?.notes && (
                  <div className="mt-3 bg-muted/60 rounded-lg p-3 text-xs text-text-secondary">
                    <span className="font-medium text-text-primary">Notes:</span> {record?.metadata?.notes}
                  </div>
                )}
              </div>
            );
          })}

          {!loading && records?.length > 0 && (
            <div className="pt-2 flex items-center justify-between text-sm text-text-secondary">
              <span>
                Page {pagination.page} of {pagination.pages || 1} · {pagination.total} total entries
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  iconName="ChevronLeft"
                  onClick={() => handlePageChange("previous")}
                  disabled={pagination.page <= 1 || loading}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  iconName="ChevronRight"
                  onClick={() => handlePageChange("next")}
                  disabled={loading || (pagination.pages !== 0 && pagination.page >= pagination.pages)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="border border-border rounded-lg p-4 bg-background/80">
          <div className="flex items-center gap-2 mb-4">
            <Icon name="PlusCircle" size={18} className="text-primary" />
            <p className="text-sm font-semibold text-text-primary">Record consent activity</p>
          </div>
          <form className="space-y-3" onSubmit={handleRecordConsent}>
            <Input
              label="Patient MRN"
              placeholder="e.g. PAT001"
              value={formState.patientMrn}
              onChange={handleInputChange("patientMrn")}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-text-primary mb-1 block">Consent type</label>
                <select
                  value={formState.consentType}
                  onChange={handleInputChange("consentType")}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {typeOptions.filter((option) => option.value !== "all").map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-text-primary mb-1 block">Consent status</label>
                <select
                  value={formState.consentStatus}
                  onChange={handleInputChange("consentStatus")}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {statusOptions.filter((option) => option.value !== "all").map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <Input
              label="Consent version"
              placeholder="e.g. v1.2"
              value={formState.consentVersion}
              onChange={handleInputChange("consentVersion")}
            />
            <div>
              <label className="text-sm font-medium text-text-primary mb-1 block">Scope / Notes surfaced to patient</label>
              <textarea
                rows={3}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Describe the scope of the consent or any constraints"
                value={formState.consentScope}
                onChange={handleInputChange("consentScope")}
              />
            </div>
            <Input
              label="Evidence URL (optional)"
              placeholder="Link to consent artefact"
              value={formState.evidenceUrl}
              onChange={handleInputChange("evidenceUrl")}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-text-primary mb-1 block">Effective from</label>
                <Input
                  type="datetime-local"
                  value={formState.effectiveFrom}
                  onChange={handleInputChange("effectiveFrom")}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-text-primary mb-1 block">Valid until</label>
                <Input
                  type="datetime-local"
                  value={formState.effectiveUntil}
                  onChange={handleInputChange("effectiveUntil")}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-text-primary mb-1 block">Compliance notes</label>
              <textarea
                rows={2}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Internal notes, e.g. consent captured over tele-consult"
                value={formState.notes}
                onChange={handleInputChange("notes")}
              />
            </div>
            {formMessage && (
              <div
                className={`text-xs rounded-md px-3 py-2 ${
                  formMessage.type === "success"
                    ? "bg-success/10 text-success border border-success/40"
                    : "bg-destructive/10 text-destructive border border-destructive/40"
                }`}
              >
                {formMessage.text}
              </div>
            )}
            <Button
              type="submit"
              variant="primary"
              size="sm"
              iconName={formSubmitting ? "Loader2" : "CheckCircle"}
              disabled={formSubmitting}
              className="w-full"
            >
              {formSubmitting ? "Recording…" : "Record consent event"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ConsentTimeline;
