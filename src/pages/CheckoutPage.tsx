import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertCircle, ArrowRight, CheckCircle2, Lock, ShoppingBag } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ApiError, apiFetch } from '../lib/apiClient';
import { formatMinorCurrency } from '../lib/money';
import { EditorialSectionHeader } from '../components/EditorialSectionHeader';
import { GlassButton } from '../components/GlassButton';

interface AvailabilitySlot {
  id: string;
  supplier_id: string;
  service_type: 'experience' | 'accommodation' | 'transport' | 'package';
  service_id: string;
  slot_date: string;
  start_time: string | null;
  total_capacity: number;
  reserved_capacity: number;
  confirmed_capacity: number;
  price_override_minor: number | null;
  currency_code: string;
}

interface CatalogListing {
  id: string;
  name: string;
  price_minor?: number;
  nightly_rate_minor?: number;
  currency_code: string;
  suppliers?: {
    trading_name: string;
    verification_status: string;
    can_accept_paid_bookings: boolean;
  };
}

interface CatalogResponse {
  configured: boolean;
  message?: string;
  experiences: CatalogListing[];
  accommodations: CatalogListing[];
  availabilitySlots: AvailabilitySlot[];
}

interface PreparedSplitGroup {
  supplierId: string;
  supplierName: string;
  beneficiaryMerchantEmail: string;
  currencyCode: string;
  items: Array<{
    slotId: string;
    serviceTitle: string;
    slotDate: string;
    quantity: number;
    unitPriceMinor: number;
    currencyCode: string;
  }>;
  pricing: {
    grossAmountMinor: number;
    commissionRateBps: number;
    commissionAmountMinor: number;
    supplierShareMinor: number;
    currencyCode: string;
  };
  isDevelopmentSampleRate: boolean;
}

interface PrepareResponse {
  requiresSplitTransactions: boolean;
  splitNotice: string | null;
  groups: PreparedSplitGroup[];
}

interface ReservedBooking {
  id: string;
  booking_reference: string;
  supplier_id: string;
  total_amount_minor: number;
  currency_code: string;
  status: string;
  payment_status: string;
}

export function CheckoutPage() {
  const { accessToken, session } = useAuth();
  const [searchParams] = useSearchParams();
  const returnMerchantRef = searchParams.get('merchantReference');

  const [catalog, setCatalog] = useState<CatalogResponse | null>(null);
  const [cartQuantities, setCartQuantities] = useState<Record<string, number>>({});
  const [prepared, setPrepared] = useState<PrepareResponse | null>(null);
  const [reservedBookings, setReservedBookings] = useState<ReservedBooking[]>([]);

  const [leadName, setLeadName] = useState('');
  const [leadEmail, setLeadEmail] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');

  const [busy, setBusy] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [returnVerification, setReturnVerification] = useState<{
    merchant_reference: string;
    provider_reference: string | null;
    status: string;
    amount_minor: number;
    currency_code: string;
    bookings?: { booking_reference: string; status: string; payment_status: string };
  } | null>(null);

  useEffect(() => {
    void apiFetch<CatalogResponse>('/api/catalog')
      .then(setCatalog)
      .catch((err) => setErrorBanner(err instanceof Error ? err.message : 'Unable to load catalog.'));
  }, []);

  useEffect(() => {
    if (session?.user?.email && !leadEmail) {
      setLeadEmail(session.user.email);
    }
  }, [session?.user?.email, leadEmail]);

  useEffect(() => {
    if (!returnMerchantRef || !accessToken) return;
    void apiFetch<{ payment: typeof returnVerification }>(
      `/api/payments/${encodeURIComponent(returnMerchantRef)}/status`,
      { accessToken },
    )
      .then((res) => setReturnVerification(res.payment))
      .catch((err) => setErrorBanner(err instanceof Error ? err.message : 'Status check failed.'));
  }, [returnMerchantRef, accessToken]);

  const serviceLookup = useMemo(() => {
    const map = new Map<string, CatalogListing>();
    for (const exp of catalog?.experiences ?? []) map.set(exp.id, exp);
    for (const acc of catalog?.accommodations ?? []) map.set(acc.id, acc);
    return map;
  }, [catalog]);

  const selectedItems = useMemo(
    () =>
      Object.entries(cartQuantities)
        .filter(([, qty]) => qty > 0)
        .map(([slotId, quantity]) => ({ slotId, quantity })),
    [cartQuantities],
  );

  async function handlePrepareCheckout() {
    if (!accessToken) {
      setErrorBanner('Please sign in first to calculate verified supplier split checkout.');
      return;
    }
    setBusy(true);
    setErrorBanner(null);
    try {
      const res = await apiFetch<PrepareResponse>('/api/bookings/prepare-checkout', {
        method: 'POST',
        accessToken,
        body: { items: selectedItems },
      });
      setPrepared(res);
    } catch (err) {
      setErrorBanner(err instanceof Error ? err.message : 'Unable to prepare split checkout.');
    } finally {
      setBusy(false);
    }
  }

  async function handleReserveBookings(e: FormEvent) {
    e.preventDefault();
    if (!accessToken || selectedItems.length === 0) return;
    setBusy(true);
    setErrorBanner(null);
    setStatusMessage(null);

    try {
      const idempotencyKey = `res-${crypto.randomUUID()}`;
      const res = await apiFetch<{ bookings: ReservedBooking[] }>('/api/bookings/reserve', {
        method: 'POST',
        accessToken,
        body: {
          idempotencyKey,
          specialRequests,
          leadGuest: {
            fullName: leadName,
            email: leadEmail,
            phone: leadPhone,
          },
          items: selectedItems,
        },
      });
      setReservedBookings(res.bookings);
      setStatusMessage(
        `Inventory locked atomically (${res.bookings.length} supplier booking${res.bookings.length > 1 ? 's' : ''}). Proceed to verify payment via Pesepay below.`,
      );
    } catch (err) {
      setErrorBanner(err instanceof Error ? err.message : 'Reservation failed.');
    } finally {
      setBusy(false);
    }
  }

  async function handleInitiatePesepay(bookingId: string) {
    if (!accessToken) return;
    setBusy(true);
    setErrorBanner(null);
    try {
      const res = await apiFetch<{ redirectUrl: string | null }>('/api/payments/pesepay/initiate', {
        method: 'POST',
        accessToken,
        body: {
          bookingId,
          idempotencyKey: `pay-${bookingId}-${Date.now()}`,
        },
      });
      if (res.redirectUrl) {
        window.location.assign(res.redirectUrl);
      } else {
        setStatusMessage('Payment initialized; awaiting Pesepay redirect URL.');
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 503) {
        setErrorBanner(
          `${err.message} Missing server credentials: ${(err.missingVars ?? []).join(', ')}.`,
        );
      } else {
        setErrorBanner(err instanceof Error ? err.message : 'Pesepay initiation failed.');
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="pt-32 pb-24 bg-[#F6F4ED] min-h-screen">
      <div className="mx-auto max-w-[1320px] px-6 sm:px-10 space-y-10">
        <EditorialSectionHeader
          eyebrow="Transend Tours · Verified Checkout"
          title="Live Slot Reservation & Split Payment"
          subtitle="Inventory locks atomically before payment initiation. Multi-supplier itineraries automatically partition into separate Pesepay beneficiary authorizations."
        />

        {returnMerchantRef && (
          <div className="bg-[#FFFFFF] border border-[#244B3A] p-6 space-y-3">
            <div className="flex items-center gap-2 text-[#102D25]">
              <CheckCircle2 className="w-5 h-5 text-[#244B3A]" />
              <h2 className="font-serif text-xl">
                Payment Return Status — {returnMerchantRef}
              </h2>
            </div>
            {!accessToken ? (
              <p className="text-sm text-[#788078]">
                Sign in to inspect verified gateway confirmation status. Return URL redirects never mark bookings as paid on their own.
              </p>
            ) : returnVerification ? (
              <div className="text-sm text-[#26342D] space-y-1">
                <p>
                  <strong>Gateway Verification Status:</strong> {returnVerification.status} ·{' '}
                  {formatMinorCurrency(
                    returnVerification.amount_minor,
                    returnVerification.currency_code,
                  )}
                </p>
                {returnVerification.bookings && (
                  <p>
                    <strong>Booking {returnVerification.bookings.booking_reference}:</strong>{' '}
                    {returnVerification.bookings.status} ({returnVerification.bookings.payment_status})
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-[#788078]">Checking server verification record...</p>
            )}
          </div>
        )}

        {errorBanner && (
          <div className="bg-[#FFFFFF] border border-red-700 p-5 flex items-start gap-3 text-sm text-red-900">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{errorBanner}</span>
          </div>
        )}

        {statusMessage && (
          <div className="bg-[#FFFFFF] border border-[#244B3A] p-5 text-sm text-[#102D25]">
            {statusMessage}
          </div>
        )}

        {!session && (
          <div className="bg-[#102D25] text-[#F6F4ED] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.16em] text-[#D9C397]">
                Authenticated Checkout Required
              </p>
              <p className="text-sm text-[#F6F4ED]/85">
                Sign in or create a traveller account to lock live supplier availability slots and initiate Pesepay checkout.
              </p>
            </div>
            <GlassButton to="/auth" variant="ivory">
              <span>Sign In / Register</span>
              <ArrowRight className="w-4 h-4" />
            </GlassButton>
          </div>
        )}

        {catalog && !catalog.configured && (
          <div className="bg-[#FFFFFF] border border-[#E7E4DA] p-8 space-y-4">
            <h2 className="font-serif text-2xl text-[#102D25]">
              Live Inventory Database Pending Connection
            </h2>
            <p className="text-sm text-[#788078] max-w-3xl leading-relaxed">
              {catalog.message} Once Supabase credentials are configured and verified suppliers publish availability slots in the{' '}
              <Link to="/portal/supplier" className="text-[#102D25] underline font-medium">
                Supplier Portal
              </Link>
              , travellers can reserve real-time slots here. For bespoke concierge enquiries without instant payment, use the{' '}
              <Link to="/book" className="text-[#102D25] underline font-medium">
                Bespoke Travel Brief
              </Link>
              .
            </p>
          </div>
        )}

        {catalog?.configured && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-7 space-y-6">
              <h2 className="font-serif text-2xl text-[#102D25]">
                Available Verified Departure &amp; Stay Slots
              </h2>
              {catalog.availabilitySlots.length === 0 ? (
                <div className="bg-[#FFFFFF] border border-[#E7E4DA] p-8 text-sm text-[#788078]">
                  No open availability slots published yet. Approved suppliers can publish slots from the Supplier Portal.
                </div>
              ) : (
                <div className="space-y-4">
                  {catalog.availabilitySlots.map((slot) => {
                    const listing = serviceLookup.get(slot.service_id);
                    const remaining =
                      slot.total_capacity - slot.reserved_capacity - slot.confirmed_capacity;
                    const unitPriceMinor =
                      slot.price_override_minor ??
                      listing?.price_minor ??
                      listing?.nightly_rate_minor ??
                      0;
                    const qty = cartQuantities[slot.id] ?? 0;

                    return (
                      <div
                        key={slot.id}
                        className="bg-[#FFFFFF] border border-[#E7E4DA] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <span className="text-[11px] uppercase tracking-[0.16em] text-[#244B3A] font-semibold">
                            {slot.service_type} · {listing?.suppliers?.trading_name || 'Verified Supplier'}
                          </span>
                          <h3 className="font-serif text-xl text-[#102D25]">
                            {listing?.name || 'Marketplace Service'}
                          </h3>
                          <p className="text-xs text-[#788078]">
                            Date: {slot.slot_date} {slot.start_time ? `· ${slot.start_time}` : ''} ·{' '}
                            {remaining} remaining
                          </p>
                        </div>

                        <div className="flex items-center gap-4">
                          <span className="font-serif text-lg text-[#102D25] tabular-nums">
                            {formatMinorCurrency(unitPriceMinor, slot.currency_code)}
                          </span>
                          <input
                            type="number"
                            min={0}
                            max={remaining}
                            value={qty}
                            onChange={(e) =>
                              setCartQuantities((prev) => ({
                                ...prev,
                                [slot.id]: Math.max(0, Math.min(remaining, Number(e.target.value) || 0)),
                              }))
                            }
                            aria-label={`Quantity for ${listing?.name || slot.id}`}
                            className="w-20 px-3 py-2 border border-[#E7E4DA] bg-[#F6F4ED] text-sm text-[#102D25]"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <aside className="lg:col-span-5 bg-[#FFFFFF] border border-[#E7E4DA] p-7 space-y-6">
              <div className="flex items-center justify-between border-b border-[#E7E4DA] pb-4">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-[#244B3A]" />
                  <h2 className="font-serif text-2xl text-[#102D25]">Split Checkout Summary</h2>
                </div>
                <Lock className="w-4 h-4 text-[#788078]" />
              </div>

              <button
                type="button"
                disabled={busy || selectedItems.length === 0}
                onClick={() => void handlePrepareCheckout()}
                className="w-full px-5 py-3 border border-[#102D25] text-xs uppercase tracking-[0.16em] font-semibold text-[#102D25] hover:bg-[#102D25] hover:text-[#F6F4ED] disabled:opacity-40 transition-colors cursor-pointer"
              >
                Calculate Verified Split Quote ({selectedItems.length} selected)
              </button>

              {prepared && (
                <div className="space-y-4">
                  {prepared.splitNotice && (
                    <div className="p-3 bg-[#F6F4ED] border border-[#D9C397] text-xs text-[#102D25] leading-relaxed">
                      {prepared.splitNotice}
                    </div>
                  )}

                  {prepared.groups.map((grp) => (
                    <div
                      key={`${grp.supplierId}:${grp.currencyCode}`}
                      className="p-4 bg-[#F6F4ED] border border-[#E7E4DA] space-y-2 text-xs"
                    >
                      <div className="flex justify-between font-semibold text-[#102D25]">
                        <span>{grp.supplierName}</span>
                        <span>
                          {formatMinorCurrency(grp.pricing.grossAmountMinor, grp.currencyCode)}
                        </span>
                      </div>
                      <p className="text-[#788078]">
                        Platform fee ({(grp.pricing.commissionRateBps / 100).toFixed(2)}%):{' '}
                        {formatMinorCurrency(grp.pricing.commissionAmountMinor, grp.currencyCode)} ·
                        Supplier share:{' '}
                        {formatMinorCurrency(grp.pricing.supplierShareMinor, grp.currencyCode)}
                      </p>
                      {grp.isDevelopmentSampleRate && (
                        <p className="text-[11px] text-amber-800">
                          Development sample commission rate applied pending custom admin rule.
                        </p>
                      )}
                    </div>
                  ))}

                  <form onSubmit={handleReserveBookings} className="space-y-3 pt-3 border-t border-[#E7E4DA]">
                    <input
                      type="text"
                      required
                      placeholder="Lead guest full name"
                      value={leadName}
                      onChange={(e) => setLeadName(e.target.value)}
                      className="w-full px-3 py-2.5 border border-[#E7E4DA] bg-[#F6F4ED] text-sm"
                    />
                    <input
                      type="email"
                      required
                      placeholder="Lead guest email"
                      value={leadEmail}
                      onChange={(e) => setLeadEmail(e.target.value)}
                      className="w-full px-3 py-2.5 border border-[#E7E4DA] bg-[#F6F4ED] text-sm"
                    />
                    <input
                      type="tel"
                      required
                      placeholder="Lead guest phone"
                      value={leadPhone}
                      onChange={(e) => setLeadPhone(e.target.value)}
                      className="w-full px-3 py-2.5 border border-[#E7E4DA] bg-[#F6F4ED] text-sm"
                    />
                    <textarea
                      rows={2}
                      placeholder="Special dietary or pickup notes (optional)"
                      value={specialRequests}
                      onChange={(e) => setSpecialRequests(e.target.value)}
                      className="w-full px-3 py-2.5 border border-[#E7E4DA] bg-[#F6F4ED] text-sm"
                    />
                    <button
                      type="submit"
                      disabled={busy}
                      className="w-full px-5 py-3.5 bg-[#102D25] text-[#F6F4ED] text-xs uppercase tracking-[0.16em] font-semibold hover:bg-[#18392F] cursor-pointer"
                    >
                      Lock Slots &amp; Create Booking
                    </button>
                  </form>
                </div>
              )}

              {reservedBookings.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-[#E7E4DA]">
                  <h3 className="text-lg tracking-[0.02em] text-[#102D25] font-normal">
                    Pay Reserved Bookings via Pesepay
                  </h3>
                  {reservedBookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="p-4 border border-[#E7E4DA] bg-[#F6F4ED] flex items-center justify-between gap-3"
                    >
                      <div className="text-xs">
                        <p className="font-semibold text-[#102D25]">{booking.booking_reference}</p>
                        <p className="text-[#788078]">
                          {formatMinorCurrency(booking.total_amount_minor, booking.currency_code)} ·{' '}
                          {booking.status}
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={busy || booking.payment_status === 'paid'}
                        onClick={() => void handleInitiatePesepay(booking.id)}
                        className="px-4 py-2 bg-[#102D25] text-[#F6F4ED] text-[11px] uppercase tracking-[0.14em] font-semibold cursor-pointer disabled:opacity-50"
                      >
                        Pay via Pesepay
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
