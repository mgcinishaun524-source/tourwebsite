import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Building2, CheckCircle2, FileCheck2, Layers } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../lib/apiClient';
import { formatMinorCurrency, parseMajorToMinor } from '../lib/money';
import { EditorialSectionHeader } from '../components/EditorialSectionHeader';

interface SupplierOverview {
  supplier: {
    id: string;
    legal_name: string;
    trading_name: string;
    registration_number: string | null;
    tax_identification_number: string | null;
    business_email: string;
    business_phone: string;
    physical_address: string | null;
    verification_status: string;
    can_accept_paid_bookings: boolean;
  } | null;
  documents?: Array<{ id: string; document_type: string; file_name: string; review_status: string }>;
  agreements?: Array<{ id: string; agreement_version: string; accepted_at: string }>;
  paymentAccounts?: Array<{ merchant_email: string; settlement_currency: string; status: string }>;
  beneficiaryArrangements?: Array<{ beneficiary_email: string; arrangement_status: string }>;
  listings?: {
    experiences: Array<{ id: string; name: string; price_minor: number; currency_code: string; publication_status: string }>;
    accommodations: Array<{ id: string; name: string; nightly_rate_minor: number; currency_code: string; publication_status: string }>;
    transport: Array<{ id: string; name: string; price_minor: number; currency_code: string; publication_status: string }>;
  };
  availabilitySlots?: Array<{
    id: string;
    service_type: string;
    service_id: string;
    slot_date: string;
    total_capacity: number;
    reserved_capacity: number;
    confirmed_capacity: number;
  }>;
}

export function SupplierPortalPage() {
  const { session, accessToken } = useAuth();
  const [data, setData] = useState<SupplierOverview | null>(null);
  const [financials, setFinancials] = useState<{
    totalsByCurrency: Record<
      string,
      { expectedSplitMinor: number; confirmedProviderMinor: number; reconciledMinor: number }
    >;
  } | null>(null);

  const [legalName, setLegalName] = useState('');
  const [tradingName, setTradingName] = useState('');
  const [regNumber, setRegNumber] = useState('');
  const [taxNumber, setTaxNumber] = useState('');
  const [businessEmail, setBusinessEmail] = useState('');
  const [businessPhone, setBusinessPhone] = useState('');
  const [pesepayEmail, setPesepayEmail] = useState('');

  // Listing form
  const [listingType, setListingType] = useState<'experience' | 'accommodation' | 'transport'>('experience');
  const [listingName, setListingName] = useState('');
  const [listingSummary, setListingSummary] = useState('');
  const [listingOverview, setListingOverview] = useState('');
  const [listingPriceMajor, setListingPriceMajor] = useState('150.00');
  const [listingCurrency, setListingCurrency] = useState<'USD' | 'ZWG'>('USD');

  // Slot form
  const [slotServiceType, setSlotServiceType] = useState<'experience' | 'accommodation' | 'transport'>('experience');
  const [slotServiceId, setSlotServiceId] = useState('');
  const [slotDate, setSlotDate] = useState(new Date(Date.now() + 86400_000).toISOString().slice(0, 10));
  const [slotCapacity, setSlotCapacity] = useState(8);

  const [docType, setDocType] = useState<
    'certificate_of_incorporation' | 'tourism_authority_licence' | 'tax_clearance' | 'director_id'
  >('tourism_authority_licence');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const loadSupplier = useCallback(async () => {
    if (!accessToken) return;
    try {
      const [overview, fin] = await Promise.all([
        apiFetch<SupplierOverview>('/api/suppliers/me', { accessToken }),
        apiFetch<{
          totalsByCurrency: Record<
            string,
            { expectedSplitMinor: number; confirmedProviderMinor: number; reconciledMinor: number }
          >;
        }>('/api/suppliers/me/financials', { accessToken }),
      ]);
      setData(overview);
      setFinancials(fin);
      if (overview.supplier) {
        setLegalName(overview.supplier.legal_name);
        setTradingName(overview.supplier.trading_name);
        setRegNumber(overview.supplier.registration_number || '');
        setTaxNumber(overview.supplier.tax_identification_number || '');
        setBusinessEmail(overview.supplier.business_email);
        setBusinessPhone(overview.supplier.business_phone);
        setPesepayEmail(overview.paymentAccounts?.[0]?.merchant_email || overview.supplier.business_email);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load supplier console.');
    }
  }, [accessToken]);

  useEffect(() => {
    void loadSupplier();
  }, [loadSupplier]);

  async function saveOnboarding(submitForReview: boolean) {
    if (!accessToken) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await apiFetch('/api/suppliers/onboarding', {
        method: 'POST',
        accessToken,
        body: {
          legalName,
          tradingName,
          registrationNumber: regNumber,
          taxIdentificationNumber: taxNumber,
          businessEmail,
          businessPhone,
          pesepayMerchantEmail: pesepayEmail || businessEmail,
          settlementCurrency: 'USD',
          submitForReview,
        },
      });
      setNotice(
        submitForReview
          ? 'Supplier profile submitted for compliance & beneficiary verification.'
          : 'Supplier profile draft saved.',
      );
      await loadSupplier();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save onboarding profile.');
    } finally {
      setBusy(false);
    }
  }

  async function uploadComplianceDocument(e: FormEvent) {
    e.preventDefault();
    if (!accessToken || !selectedFile) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const res = await apiFetch<{ uploadUrl: string }>('/api/suppliers/me/documents/signed-upload', {
        method: 'POST',
        accessToken,
        body: {
          documentType: docType,
          fileName: selectedFile.name,
          mimeType: selectedFile.type,
          fileSizeBytes: selectedFile.size,
        },
      });
      const uploadResp = await fetch(res.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': selectedFile.type },
        body: selectedFile,
      });
      if (!uploadResp.ok) {
        throw new Error('Private document upload to storage bucket failed.');
      }
      setNotice('Compliance document uploaded securely to private storage.');
      setSelectedFile(null);
      await loadSupplier();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Document upload failed.');
    } finally {
      setBusy(false);
    }
  }

  async function acceptSupplierAgreement() {
    if (!accessToken) return;
    setBusy(true);
    setError(null);
    try {
      await apiFetch('/api/suppliers/me/agreements', {
        method: 'POST',
        accessToken,
        body: { agreementVersion: '2026-v1', accepted: true },
      });
      setNotice('Accepted TRANSEND TOURS (PRIVATE) LIMITED Marketplace Supplier Agreement (2026-v1).');
      await loadSupplier();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to record agreement acceptance.');
    } finally {
      setBusy(false);
    }
  }

  async function createServiceListing(e: FormEvent) {
    e.preventDefault();
    if (!accessToken) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await apiFetch('/api/suppliers/me/listings', {
        method: 'POST',
        accessToken,
        body: {
          listingType,
          name: listingName,
          shortDescription: listingSummary,
          overview: listingOverview,
          priceMinor: parseMajorToMinor(listingPriceMajor),
          currencyCode: listingCurrency,
        },
      });
      setListingName('');
      setListingSummary('');
      setListingOverview('');
      setNotice('Listing created and queued for curation & verification review.');
      await loadSupplier();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create listing.');
    } finally {
      setBusy(false);
    }
  }

  async function publishAvailabilitySlot(e: FormEvent) {
    e.preventDefault();
    if (!accessToken || !slotServiceId) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await apiFetch('/api/suppliers/me/availability', {
        method: 'POST',
        accessToken,
        body: {
          serviceType: slotServiceType,
          serviceId: slotServiceId,
          slotDate,
          totalCapacity: slotCapacity,
          currencyCode: 'USD',
        },
      });
      setNotice('Availability slot published.');
      await loadSupplier();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to publish slot.');
    } finally {
      setBusy(false);
    }
  }

  const allServices = [
    ...(data?.listings?.experiences ?? []).map((i) => ({ ...i, type: 'experience' as const })),
    ...(data?.listings?.accommodations ?? []).map((i) => ({ ...i, type: 'accommodation' as const })),
    ...(data?.listings?.transport ?? []).map((i) => ({ ...i, type: 'transport' as const })),
  ];

  return (
    <div className="pt-32 pb-24 bg-[#F6F4ED] min-h-screen">
      <div className="mx-auto max-w-[1320px] px-6 sm:px-10 space-y-10">
        <EditorialSectionHeader
          eyebrow="Transend Tours · Supplier Console"
          title="Supplier Onboarding, Inventory & Split Settlements"
          subtitle="Manage legal verification, private KYC uploads, Pesepay beneficiary setup, service inventory, and currency-separated settlement tracking."
        />

        {!session ? (
          <div className="bg-[#FFFFFF] border border-[#E7E4DA] p-8 space-y-4">
            <h2 className="font-serif text-2xl text-[#102D25]">Supplier Authentication Required</h2>
            <p className="text-sm text-[#788078]">
              Sign in or register as a tourism supplier to submit onboarding credentials for approval.
            </p>
            <Link
              to="/auth"
              className="inline-block px-5 py-3 bg-[#102D25] text-[#F6F4ED] text-xs uppercase tracking-[0.16em] font-semibold"
            >
              Sign In / Register Supplier
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {error && (
              <div className="p-4 bg-[#FFFFFF] border border-red-700 text-sm text-red-900">
                {error}
              </div>
            )}
            {notice && (
              <div className="p-4 bg-[#FFFFFF] border border-[#244B3A] text-sm text-[#102D25]">
                {notice}
              </div>
            )}

            {/* Status & Financial Summary Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="bg-[#FFFFFF] border border-[#E7E4DA] p-6 space-y-1">
                <span className="text-xs uppercase tracking-[0.16em] text-[#788078]">
                  Verification Status
                </span>
                <p className="font-serif text-2xl text-[#102D25] uppercase">
                  {data?.supplier?.verification_status || 'not started'}
                </p>
                <p className="text-xs text-[#244B3A]">
                  {data?.supplier?.can_accept_paid_bookings
                    ? 'Approved for live Pesepay split-payment bookings'
                    : 'Paid split bookings locked until compliance & beneficiary approval'}
                </p>
              </div>

              <div className="bg-[#FFFFFF] border border-[#E7E4DA] p-6 space-y-1">
                <span className="text-xs uppercase tracking-[0.16em] text-[#788078]">
                  Beneficiary Arrangement
                </span>
                <p className="font-serif text-xl text-[#102D25]">
                  {data?.beneficiaryArrangements?.[0]?.arrangement_status || 'pending_setup'}
                </p>
                <p className="text-xs text-[#788078]">
                  {data?.paymentAccounts?.[0]?.merchant_email || 'No Pesepay email linked yet'}
                </p>
              </div>

              <div className="bg-[#FFFFFF] border border-[#E7E4DA] p-6 space-y-1">
                <span className="text-xs uppercase tracking-[0.16em] text-[#788078]">
                  Expected Split Settlements
                </span>
                {Object.entries(financials?.totalsByCurrency ?? {}).length === 0 ? (
                  <p className="font-serif text-xl text-[#102D25]">USD 0.00</p>
                ) : (
                  Object.entries(financials?.totalsByCurrency ?? {}).map(([curr, vals]) => (
                    <p key={curr} className="text-xs text-[#102D25]">
                      <strong>{curr}:</strong> Expected{' '}
                      {formatMinorCurrency(vals.expectedSplitMinor, curr)} · Confirmed{' '}
                      {formatMinorCurrency(vals.confirmedProviderMinor, curr)}
                    </p>
                  ))
                )}
              </div>
            </div>

            {/* Step 1 & 2: Business Profile + KYC Documents + Agreement */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-7 bg-[#FFFFFF] border border-[#E7E4DA] p-8 space-y-5">
                <div className="flex items-center gap-2 text-[#102D25]">
                  <Building2 className="w-5 h-5 text-[#244B3A]" />
                  <h2 className="font-serif text-2xl">Business Profile &amp; Payout Merchant</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Registered Legal Entity Name"
                    value={legalName}
                    onChange={(e) => setLegalName(e.target.value)}
                    className="px-3 py-2.5 border border-[#E7E4DA] bg-[#F6F4ED] text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Public Trading Name"
                    value={tradingName}
                    onChange={(e) => setTradingName(e.target.value)}
                    className="px-3 py-2.5 border border-[#E7E4DA] bg-[#F6F4ED] text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Company Registration No."
                    value={regNumber}
                    onChange={(e) => setRegNumber(e.target.value)}
                    className="px-3 py-2.5 border border-[#E7E4DA] bg-[#F6F4ED] text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Tax ID / ZIMRA BP Number"
                    value={taxNumber}
                    onChange={(e) => setTaxNumber(e.target.value)}
                    className="px-3 py-2.5 border border-[#E7E4DA] bg-[#F6F4ED] text-sm"
                  />
                  <input
                    type="email"
                    placeholder="Official Business Email"
                    value={businessEmail}
                    onChange={(e) => setBusinessEmail(e.target.value)}
                    className="px-3 py-2.5 border border-[#E7E4DA] bg-[#F6F4ED] text-sm"
                  />
                  <input
                    type="tel"
                    placeholder="Business Phone"
                    value={businessPhone}
                    onChange={(e) => setBusinessPhone(e.target.value)}
                    className="px-3 py-2.5 border border-[#E7E4DA] bg-[#F6F4ED] text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-[0.14em] text-[#788078] mb-1.5">
                    Verified Pesepay Merchant Payout Email (Required for Split Payments)
                  </label>
                  <input
                    type="email"
                    placeholder="merchant-payout@supplier.com"
                    value={pesepayEmail}
                    onChange={(e) => setPesepayEmail(e.target.value)}
                    className="w-full px-3 py-2.5 border border-[#E7E4DA] bg-[#F6F4ED] text-sm"
                  />
                </div>

                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void saveOnboarding(false)}
                    className="px-5 py-3 border border-[#102D25] text-xs uppercase tracking-[0.16em] font-semibold text-[#102D25] cursor-pointer"
                  >
                    Save Draft
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void saveOnboarding(true)}
                    className="px-5 py-3 bg-[#102D25] text-[#F6F4ED] text-xs uppercase tracking-[0.16em] font-semibold cursor-pointer"
                  >
                    Submit for Verification Review
                  </button>
                </div>
              </div>

              <div className="lg:col-span-5 space-y-6">
                <div className="bg-[#FFFFFF] border border-[#E7E4DA] p-7 space-y-4">
                  <div className="flex items-center gap-2 text-[#102D25]">
                    <FileCheck2 className="w-5 h-5 text-[#244B3A]" />
                    <h3 className="font-serif text-xl">Private KYC Documents</h3>
                  </div>
                  <form onSubmit={uploadComplianceDocument} className="space-y-3">
                    <select
                      value={docType}
                      onChange={(e) => setDocType(e.target.value as typeof docType)}
                      className="w-full px-3 py-2.5 border border-[#E7E4DA] bg-[#F6F4ED] text-xs"
                    >
                      <option value="tourism_authority_licence">Tourism Authority Licence</option>
                      <option value="certificate_of_incorporation">Certificate of Incorporation</option>
                      <option value="tax_clearance">Tax Clearance Certificate</option>
                      <option value="director_id">Director Identification</option>
                    </select>
                    <input
                      type="file"
                      accept="application/pdf,image/jpeg,image/png,image/webp"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
                      className="w-full text-xs"
                    />
                    <button
                      type="submit"
                      disabled={busy || !selectedFile || !data?.supplier}
                      className="w-full px-4 py-2.5 bg-[#102D25] text-[#F6F4ED] text-xs uppercase tracking-[0.14em] font-semibold disabled:opacity-40 cursor-pointer"
                    >
                      Upload Private Document
                    </button>
                  </form>
                  {(data?.documents?.length ?? 0) > 0 && (
                    <ul className="text-xs space-y-1.5 border-t border-[#E7E4DA] pt-3">
                      {data!.documents!.map((d) => (
                        <li key={d.id} className="flex justify-between">
                          <span>{d.file_name}</span>
                          <span className="uppercase text-[#244B3A]">{d.review_status}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="bg-[#FFFFFF] border border-[#E7E4DA] p-7 space-y-3">
                  <div className="flex items-center gap-2 text-[#102D25]">
                    <CheckCircle2 className="w-5 h-5 text-[#244B3A]" />
                    <h3 className="font-serif text-xl">Supplier Marketplace Agreement</h3>
                  </div>
                  <p className="text-xs text-[#788078] leading-relaxed">
                    Accept commercial split-settlement terms and safety obligations with{' '}
                    <strong>TRANSEND TOURS (PRIVATE) LIMITED</strong>.
                  </p>
                  {data?.agreements?.length ? (
                    <p className="text-xs text-[#244B3A] font-medium">
                      Accepted version {data.agreements[0].agreement_version}
                    </p>
                  ) : (
                    <button
                      type="button"
                      disabled={busy || !data?.supplier}
                      onClick={() => void acceptSupplierAgreement()}
                      className="w-full px-4 py-2.5 border border-[#102D25] text-xs uppercase tracking-[0.14em] font-semibold text-[#102D25] disabled:opacity-40 cursor-pointer"
                    >
                      Accept Supplier Agreement (2026-v1)
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Step 3: Services & Live Availability Slots */}
            {data?.supplier && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <form
                  onSubmit={createServiceListing}
                  className="lg:col-span-6 bg-[#FFFFFF] border border-[#E7E4DA] p-7 space-y-4"
                >
                  <div className="flex items-center gap-2 text-[#102D25]">
                    <Layers className="w-5 h-5 text-[#244B3A]" />
                    <h3 className="font-serif text-xl">Create Service Listing</h3>
                  </div>
                  <select
                    value={listingType}
                    onChange={(e) => setListingType(e.target.value as typeof listingType)}
                    className="w-full px-3 py-2.5 border border-[#E7E4DA] bg-[#F6F4ED] text-sm"
                  >
                    <option value="experience">Experience / Excursion</option>
                    <option value="accommodation">Accommodation Property</option>
                    <option value="transport">Transport &amp; Transfer</option>
                  </select>
                  <input
                    type="text"
                    required
                    placeholder="Service Title"
                    value={listingName}
                    onChange={(e) => setListingName(e.target.value)}
                    className="w-full px-3 py-2.5 border border-[#E7E4DA] bg-[#F6F4ED] text-sm"
                  />
                  <input
                    type="text"
                    required
                    minLength={10}
                    placeholder="Short Description"
                    value={listingSummary}
                    onChange={(e) => setListingSummary(e.target.value)}
                    className="w-full px-3 py-2.5 border border-[#E7E4DA] bg-[#F6F4ED] text-sm"
                  />
                  <textarea
                    required
                    minLength={20}
                    rows={3}
                    placeholder="Detailed itinerary & inclusions overview"
                    value={listingOverview}
                    onChange={(e) => setListingOverview(e.target.value)}
                    className="w-full px-3 py-2.5 border border-[#E7E4DA] bg-[#F6F4ED] text-sm"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      required
                      placeholder="Price (e.g. 150.00)"
                      value={listingPriceMajor}
                      onChange={(e) => setListingPriceMajor(e.target.value)}
                      className="px-3 py-2.5 border border-[#E7E4DA] bg-[#F6F4ED] text-sm"
                    />
                    <select
                      value={listingCurrency}
                      onChange={(e) => setListingCurrency(e.target.value as 'USD' | 'ZWG')}
                      className="px-3 py-2.5 border border-[#E7E4DA] bg-[#F6F4ED] text-sm"
                    >
                      <option value="USD">USD</option>
                      <option value="ZWG">ZWG</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    disabled={busy}
                    className="w-full px-5 py-3 bg-[#102D25] text-[#F6F4ED] text-xs uppercase tracking-[0.16em] font-semibold cursor-pointer"
                  >
                    Save &amp; Submit Listing
                  </button>
                </form>

                <form
                  onSubmit={publishAvailabilitySlot}
                  className="lg:col-span-6 bg-[#FFFFFF] border border-[#E7E4DA] p-7 space-y-4"
                >
                  <h3 className="font-serif text-xl text-[#102D25]">
                    Publish Bookable Availability Slot
                  </h3>
                  <select
                    value={slotServiceId}
                    onChange={(e) => {
                      const id = e.target.value;
                      setSlotServiceId(id);
                      const found = allServices.find((s) => s.id === id);
                      if (found) setSlotServiceType(found.type);
                    }}
                    className="w-full px-3 py-2.5 border border-[#E7E4DA] bg-[#F6F4ED] text-sm"
                  >
                    <option value="">Select your listing...</option>
                    {allServices.map((s) => (
                      <option key={s.id} value={s.id}>
                        [{s.type}] {s.name} ({s.publication_status})
                      </option>
                    ))}
                  </select>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="date"
                      required
                      value={slotDate}
                      onChange={(e) => setSlotDate(e.target.value)}
                      className="px-3 py-2.5 border border-[#E7E4DA] bg-[#F6F4ED] text-sm"
                    />
                    <input
                      type="number"
                      min={1}
                      max={500}
                      required
                      value={slotCapacity}
                      onChange={(e) => setSlotCapacity(Number(e.target.value) || 1)}
                      className="px-3 py-2.5 border border-[#E7E4DA] bg-[#F6F4ED] text-sm"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={busy || !slotServiceId}
                    className="w-full px-5 py-3 border border-[#102D25] text-xs uppercase tracking-[0.16em] font-semibold text-[#102D25] hover:bg-[#102D25] hover:text-[#F6F4ED] disabled:opacity-40 cursor-pointer"
                  >
                    Publish Slot Capacity
                  </button>

                  {(data.availabilitySlots?.length ?? 0) > 0 && (
                    <ul className="text-xs space-y-1.5 border-t border-[#E7E4DA] pt-3 max-h-48 overflow-y-auto">
                      {data.availabilitySlots!.map((s) => (
                        <li key={s.id} className="flex justify-between">
                          <span>
                            {s.slot_date} · {s.service_type}
                          </span>
                          <span>
                            Booked {s.confirmed_capacity} / Hold {s.reserved_capacity} / Cap{' '}
                            {s.total_capacity}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </form>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
