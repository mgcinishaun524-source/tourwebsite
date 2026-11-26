import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Download, ShieldAlert, Wallet } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../lib/apiClient';
import { formatMinorCurrency } from '../lib/money';
import { EditorialSectionHeader } from '../components/EditorialSectionHeader';

interface ConfigStatusResponse {
  legalEntity: string;
  brand: string;
  supabaseConfigured: boolean;
  pesepay: {
    environment: string;
    configured: boolean;
    liveEnabled: boolean;
    splitRefundsVerified: boolean;
  };
  companyProfileConfigured: Record<string, boolean>;
}

interface AdminOverviewResponse {
  suppliers: Array<{
    id: string;
    legal_name: string;
    trading_name: string;
    business_email: string;
    verification_status: string;
    can_accept_paid_bookings: boolean;
    supplier_payment_accounts?: Array<{ merchant_email: string }>;
  }>;
  bookings: Array<{
    id: string;
    booking_reference: string;
    total_amount_minor: number;
    currency_code: string;
    status: string;
    payment_status: string;
    suppliers?: { trading_name: string } | null;
  }>;
  commissionRules: Array<{
    id: string;
    name: string;
    scope_type: string;
    rate_bps: number;
    priority: number;
    is_development_sample: boolean;
  }>;
  refunds: Array<{
    id: string;
    status: string;
    refund_type: string;
    refund_amount_minor: number;
    currency_code: string;
    provider_limitation_flagged: boolean;
    bookings?: { booking_reference: string } | null;
  }>;
  ledgerTotalsByCurrency: Record<
    string,
    { commissionRevenueMinor: number; supplierClearingMinor: number; gatewayClearingMinor: number }
  >;
  securityEvents: Array<{
    id: string;
    severity: string;
    event_code: string;
    summary: string;
    created_at: string;
  }>;
}

export function AdminPortalPage() {
  const { session, accessToken, userContext } = useAuth();
  const [configStatus, setConfigStatus] = useState<ConfigStatusResponse | null>(null);
  const [overview, setOverview] = useState<AdminOverviewResponse | null>(null);
  const [ruleName, setRuleName] = useState('');
  const [ruleRateBps, setRuleRateBps] = useState(1000);
  const [ruleScope, setRuleScope] = useState<'global' | 'category' | 'supplier'>('global');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const hasPrivilegedRole = Boolean(
    userContext?.user.roles.some((r) =>
      ['operations', 'content_manager', 'finance', 'admin', 'super_admin'].includes(r),
    ),
  );

  const loadData = useCallback(async () => {
    try {
      const cfg = await apiFetch<ConfigStatusResponse>('/api/system/config-status');
      setConfigStatus(cfg);
      if (accessToken && hasPrivilegedRole) {
        const data = await apiFetch<AdminOverviewResponse>('/api/admin/overview', { accessToken });
        setOverview(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load admin console.');
    }
  }, [accessToken, hasPrivilegedRole]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function verifySupplier(
    supplierId: string,
    verificationStatus: 'approved' | 'rejected' | 'additional_info_required',
  ) {
    if (!accessToken) return;
    setError(null);
    setNotice(null);
    try {
      await apiFetch(`/api/admin/suppliers/${supplierId}/verify`, {
        method: 'PATCH',
        accessToken,
        body: {
          verificationStatus,
          notes: `Compliance action: ${verificationStatus}`,
        },
      });
      setNotice(`Supplier verification status updated to ${verificationStatus}.`);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update supplier status.');
    }
  }

  async function createCommissionRule(e: FormEvent) {
    e.preventDefault();
    if (!accessToken) return;
    setError(null);
    setNotice(null);
    try {
      await apiFetch('/api/admin/commission-rules', {
        method: 'POST',
        accessToken,
        body: {
          name: ruleName,
          scopeType: ruleScope,
          rateBps: ruleRateBps,
          priority: 100,
          isDevelopmentSample: false,
        },
      });
      setRuleName('');
      setNotice('Commission rule activated.');
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create commission rule.');
    }
  }

  async function transitionRefund(refundId: string, targetStatus: string) {
    if (!accessToken) return;
    setError(null);
    setNotice(null);
    try {
      await apiFetch(`/api/refunds/${refundId}/transition`, {
        method: 'POST',
        accessToken,
        body: { targetStatus },
      });
      setNotice(`Refund moved to ${targetStatus}.`);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Refund transition blocked.');
    }
  }

  async function runReconciliation(currencyCode: 'USD' | 'ZWG') {
    if (!accessToken) return;
    setError(null);
    setNotice(null);
    try {
      const res = await apiFetch<{ run: { matched_count: number; discrepancy_count: number } }>(
        '/api/admin/reconcile',
        {
          method: 'POST',
          accessToken,
          body: { currencyCode },
        },
      );
      setNotice(
        `Reconciliation (${currencyCode}): ${res.run.matched_count} matched, ${res.run.discrepancy_count} discrepancies.`,
      );
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reconciliation failed.');
    }
  }

  async function downloadLedgerCsv() {
    if (!accessToken) return;
    try {
      const resp = await fetch('/api/admin/ledger/export.csv', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!resp.ok) throw new Error('Unable to export CSV');
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `transend-tours-ledger-${new Date().toISOString().slice(0, 10)}.csv`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'CSV export failed.');
    }
  }

  return (
    <div className="pt-32 pb-24 bg-[#F6F4ED] min-h-screen">
      <div className="mx-auto max-w-[1320px] px-6 sm:px-10 space-y-10">
        <EditorialSectionHeader
          eyebrow="TRANSEND TOURS (PRIVATE) LIMITED · Governance"
          title="Operations, Finance & Compliance Portal"
          subtitle="Strict role-based access with AAL2 MFA enforcement on supplier approvals, commission edits, refund execution, and ledger reconciliation."
        />

        {configStatus && (
          <div className="bg-[#FFFFFF] border border-[#E7E4DA] p-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="uppercase tracking-[0.14em] text-[#788078] block">Database &amp; Auth</span>
              <span className="font-semibold text-[#102D25]">
                {configStatus.supabaseConfigured ? 'Supabase Configured' : 'Pending SUPABASE_URL / Keys'}
              </span>
            </div>
            <div>
              <span className="uppercase tracking-[0.14em] text-[#788078] block">
                Pesepay ({configStatus.pesepay.environment})
              </span>
              <span className="font-semibold text-[#102D25]">
                {configStatus.pesepay.configured ? 'Credentials Loaded' : 'Merchant Keys Unconfigured'} ·{' '}
                {configStatus.pesepay.splitRefundsVerified
                  ? 'Split Refunds Confirmed'
                  : 'Split Refunds Locked'}
              </span>
            </div>
            <div>
              <span className="uppercase tracking-[0.14em] text-[#788078] block">
                Corporate Filings
              </span>
              <span className="font-semibold text-[#102D25]">
                {Object.values(configStatus.companyProfileConfigured).every(Boolean)
                  ? 'Complete'
                  : 'Registration / Contact Fields Pending'}
              </span>
            </div>
          </div>
        )}

        {error && (
          <div className="p-4 bg-[#FFFFFF] border border-red-700 text-sm text-red-900">{error}</div>
        )}
        {notice && (
          <div className="p-4 bg-[#FFFFFF] border border-[#244B3A] text-sm text-[#102D25]">
            {notice}
          </div>
        )}

        {!session || !hasPrivilegedRole ? (
          <div className="bg-[#FFFFFF] border border-[#E7E4DA] p-8 space-y-4">
            <ShieldAlert className="w-6 h-6 text-[#244B3A]" />
            <h2 className="font-serif text-2xl text-[#102D25]">
              Elevated RBAC Permissions Required
            </h2>
            <p className="text-sm text-[#788078] max-w-2xl">
              {session
                ? `Signed in as ${userContext?.user.email} (roles: ${userContext?.user.roles.join(', ')}). Only finance, operations, content_manager, admin, or super_admin users may access internal ledger and compliance queues.`
                : 'Sign in with an authorized operations, finance, or administrator account.'}
            </p>
            <Link
              to="/auth"
              className="inline-block px-5 py-3 bg-[#102D25] text-[#F6F4ED] text-xs uppercase tracking-[0.16em] font-semibold"
            >
              Sign In / Verify MFA
            </Link>
          </div>
        ) : overview ? (
          <div className="space-y-10">
            {/* Double-Entry Ledger Totals & Reconciliation */}
            <section className="bg-[#FFFFFF] border border-[#E7E4DA] p-7 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-[#102D25]">
                  <Wallet className="w-5 h-5 text-[#244B3A]" />
                  <h2 className="font-serif text-2xl">Double-Entry Ledger &amp; Reconciliation</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void runReconciliation('USD')}
                    className="px-4 py-2 border border-[#102D25] text-xs uppercase tracking-[0.14em] font-semibold cursor-pointer"
                  >
                    Reconcile USD
                  </button>
                  <button
                    type="button"
                    onClick={() => void downloadLedgerCsv()}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#102D25] text-[#F6F4ED] text-xs uppercase tracking-[0.14em] font-semibold cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export Ledger CSV</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Object.entries(overview.ledgerTotalsByCurrency).length === 0 ? (
                  <p className="text-sm text-[#788078]">No posted ledger journals yet.</p>
                ) : (
                  Object.entries(overview.ledgerTotalsByCurrency).map(([curr, totals]) => (
                    <div key={curr} className="p-4 bg-[#F6F4ED] border border-[#E7E4DA] text-xs space-y-1">
                      <p className="font-semibold text-[#102D25]">{curr} Accounts</p>
                      <p>Commission Revenue: {formatMinorCurrency(totals.commissionRevenueMinor, curr)}</p>
                      <p>Supplier Clearing: {formatMinorCurrency(totals.supplierClearingMinor, curr)}</p>
                      <p>Gateway Clearing: {formatMinorCurrency(totals.gatewayClearingMinor, curr)}</p>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* Supplier Compliance Queue */}
            <section className="bg-[#FFFFFF] border border-[#E7E4DA] p-7 space-y-4">
              <h2 className="font-serif text-2xl text-[#102D25]">Supplier Compliance Queue</h2>
              <div className="divide-y divide-[#E7E4DA]">
                {overview.suppliers.map((sup) => (
                  <div
                    key={sup.id}
                    className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 text-sm"
                  >
                    <div>
                      <p className="font-semibold text-[#102D25]">
                        {sup.trading_name} ({sup.legal_name})
                      </p>
                      <p className="text-xs text-[#788078]">
                        {sup.business_email} · Pesepay:{' '}
                        {sup.supplier_payment_accounts?.[0]?.merchant_email || 'None'} · Status:{' '}
                        <strong className="uppercase">{sup.verification_status}</strong>
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => void verifySupplier(sup.id, 'approved')}
                        className="px-3 py-1.5 bg-[#102D25] text-[#F6F4ED] text-xs uppercase tracking-[0.12em] cursor-pointer"
                      >
                        Approve &amp; Activate Split
                      </button>
                      <button
                        type="button"
                        onClick={() => void verifySupplier(sup.id, 'additional_info_required')}
                        className="px-3 py-1.5 border border-[#E7E4DA] text-xs uppercase tracking-[0.12em] cursor-pointer"
                      >
                        Request Info
                      </button>
                      <button
                        type="button"
                        onClick={() => void verifySupplier(sup.id, 'rejected')}
                        className="px-3 py-1.5 border border-red-700 text-red-900 text-xs uppercase tracking-[0.12em] cursor-pointer"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Commission Rules & Refund Queue */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-6 bg-[#FFFFFF] border border-[#E7E4DA] p-7 space-y-4">
                <h2 className="font-serif text-2xl text-[#102D25]">Commission Rules</h2>
                <form onSubmit={createCommissionRule} className="space-y-3">
                  <input
                    type="text"
                    required
                    placeholder="Rule Name"
                    value={ruleName}
                    onChange={(e) => setRuleName(e.target.value)}
                    className="w-full px-3 py-2 border border-[#E7E4DA] bg-[#F6F4ED] text-sm"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <select
                      value={ruleScope}
                      onChange={(e) => setRuleScope(e.target.value as typeof ruleScope)}
                      className="px-3 py-2 border border-[#E7E4DA] bg-[#F6F4ED] text-sm"
                    >
                      <option value="global">Global</option>
                      <option value="category">Category</option>
                      <option value="supplier">Supplier</option>
                    </select>
                    <input
                      type="number"
                      min={0}
                      max={5000}
                      value={ruleRateBps}
                      onChange={(e) => setRuleRateBps(Number(e.target.value) || 0)}
                      placeholder="Basis points (1000 = 10%)"
                      className="px-3 py-2 border border-[#E7E4DA] bg-[#F6F4ED] text-sm"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-[#102D25] text-[#F6F4ED] text-xs uppercase tracking-[0.14em] font-semibold cursor-pointer"
                  >
                    Create Basis-Point Rule
                  </button>
                </form>
                <ul className="text-xs divide-y divide-[#E7E4DA]">
                  {overview.commissionRules.map((r) => (
                    <li key={r.id} className="py-2 flex justify-between">
                      <span>
                        {r.name} ({r.scope_type})
                      </span>
                      <span className="font-semibold">{(r.rate_bps / 100).toFixed(2)}%</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="lg:col-span-6 bg-[#FFFFFF] border border-[#E7E4DA] p-7 space-y-4">
                <h2 className="font-serif text-2xl text-[#102D25]">Refund Review Queue</h2>
                <div className="divide-y divide-[#E7E4DA] text-xs">
                  {overview.refunds.length === 0 ? (
                    <p className="text-[#788078]">No pending refund requests.</p>
                  ) : (
                    overview.refunds.map((ref) => (
                      <div key={ref.id} className="py-3 space-y-2">
                        <div className="flex justify-between font-semibold text-[#102D25]">
                          <span>
                            {ref.bookings?.booking_reference || ref.id.slice(0, 8)} · {ref.status}
                          </span>
                          <span>{formatMinorCurrency(ref.refund_amount_minor, ref.currency_code)}</span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => void transitionRefund(ref.id, 'APPROVED')}
                            className="px-3 py-1 bg-[#102D25] text-[#F6F4ED] cursor-pointer"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => void transitionRefund(ref.id, 'REJECTED')}
                            className="px-3 py-1 border border-red-700 text-red-900 cursor-pointer"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Security Events */}
            <section className="bg-[#FFFFFF] border border-[#E7E4DA] p-7 space-y-3">
              <h2 className="font-serif text-xl text-[#102D25]">Recent Security Events</h2>
              <div className="text-xs divide-y divide-[#E7E4DA] max-h-60 overflow-y-auto">
                {overview.securityEvents.length === 0 ? (
                  <p className="text-[#788078]">No security events recorded.</p>
                ) : (
                  overview.securityEvents.map((ev) => (
                    <div key={ev.id} className="py-2 flex justify-between gap-4">
                      <span>
                        <strong className="uppercase">[{ev.severity}]</strong> {ev.event_code} —{' '}
                        {ev.summary}
                      </span>
                      <span className="text-[#788078] shrink-0">
                        {new Date(ev.created_at).toLocaleString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        ) : null}
      </div>
    </div>
  );
}
