import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CalendarCheck2, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../lib/apiClient';
import { formatMinorCurrency } from '../lib/money';
import { EditorialSectionHeader } from '../components/EditorialSectionHeader';
import { GlassButton } from '../components/GlassButton';

interface CustomerBooking {
  id: string;
  booking_reference: string;
  currency_code: string;
  total_amount_minor: number;
  status: string;
  payment_status: string;
  created_at: string;
  suppliers?: { trading_name: string } | null;
  booking_items?: Array<{
    id: string;
    service_title: string;
    service_date: string;
    quantity: number;
    line_total_minor: number;
  }>;
  refunds?: Array<{
    id: string;
    status: string;
    refund_amount_minor: number;
    currency_code: string;
    provider_limitation_flagged: boolean;
  }>;
}

export function CustomerPortalPage() {
  const { session, accessToken, userContext } = useAuth();
  const [bookings, setBookings] = useState<CustomerBooking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [reasonByBooking, setReasonByBooking] = useState<Record<string, string>>({});

  const loadBookings = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<{ bookings: CustomerBooking[] }>('/api/bookings/mine', {
        accessToken,
      });
      setBookings(res.bookings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load bookings.');
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void loadBookings();
  }, [loadBookings]);

  async function submitCancelRequest(bookingId: string) {
    if (!accessToken) return;
    const reason = (reasonByBooking[bookingId] || '').trim();
    if (reason.length < 5) {
      setError('Enter a brief cancellation reason (at least 5 characters).');
      return;
    }
    setError(null);
    setNotice(null);
    try {
      await apiFetch(`/api/bookings/${bookingId}/cancel-request`, {
        method: 'POST',
        accessToken,
        body: { reason },
      });
      setNotice('Cancellation request submitted for operations review.');
      await loadBookings();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit cancellation request.');
    }
  }

  async function submitRefundRequest(booking: CustomerBooking) {
    if (!accessToken) return;
    const reason = (reasonByBooking[booking.id] || '').trim() || 'Customer requested full refund';
    setError(null);
    setNotice(null);
    try {
      await apiFetch('/api/refunds/request', {
        method: 'POST',
        accessToken,
        body: {
          bookingId: booking.id,
          refundType: 'full',
          refundAmountMinor: booking.total_amount_minor,
          reason,
          idempotencyKey: `ref-${booking.id}-${Date.now()}`,
        },
      });
      setNotice(
        'Refund request recorded and queued for finance verification and split reversal review.',
      );
      await loadBookings();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit refund request.');
    }
  }

  return (
    <div className="pt-32 pb-24 bg-[#F6F4ED] min-h-screen">
      <div className="mx-auto max-w-[1320px] px-6 sm:px-10 space-y-10">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <EditorialSectionHeader
            eyebrow="Transend Tours · Traveller Portal"
            title="Bookings, Receipts & Refund Requests"
            subtitle="Inspect confirmed bookings, Pesepay verification receipts, cancellation requests, and refund progress."
          />
          <GlassButton to="/checkout" variant="forest">
            <span>New Reservation</span>
            <ArrowRight className="w-4 h-4" />
          </GlassButton>
        </div>

        {!session ? (
          <div className="bg-[#FFFFFF] border border-[#E7E4DA] p-8 space-y-4">
            <h2 className="font-serif text-2xl text-[#102D25]">Sign In to View Your Trips</h2>
            <p className="text-sm text-[#788078]">
              Traveller bookings, receipts, and refund requests are strictly isolated per authenticated account.
            </p>
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 px-5 py-3 bg-[#102D25] text-[#F6F4ED] text-xs uppercase tracking-[0.16em] font-semibold"
            >
              <span>Go to Sign In</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between text-xs text-[#788078] border-y border-[#E7E4DA] py-3">
              <span>
                Signed in as <strong className="text-[#102D25]">{userContext?.user.email}</strong>
              </span>
              <button
                type="button"
                onClick={() => void loadBookings()}
                className="inline-flex items-center gap-1.5 uppercase tracking-[0.14em] text-[#102D25] font-semibold cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh</span>
              </button>
            </div>

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

            {loading ? (
              <p className="text-sm text-[#788078]">Loading reservations...</p>
            ) : bookings.length === 0 ? (
              <div className="bg-[#FFFFFF] border border-[#E7E4DA] p-8 space-y-3">
                <CalendarCheck2 className="w-6 h-6 text-[#244B3A]" />
                <h3 className="font-serif text-xl text-[#102D25]">No Bookings Found</h3>
                <p className="text-sm text-[#788078]">
                  Browse Transend Tours experiences or open Live Checkout to reserve verified availability.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {bookings.map((b) => (
                  <article
                    key={b.id}
                    className="bg-[#FFFFFF] border border-[#E7E4DA] p-7 space-y-5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E7E4DA] pb-4">
                      <div>
                        <span className="text-xs uppercase tracking-[0.16em] text-[#244B3A] font-semibold">
                          {b.suppliers?.trading_name || 'Verified Supplier'}
                        </span>
                        <h3 className="font-serif text-2xl text-[#102D25] mt-0.5">
                          {b.booking_reference}
                        </h3>
                      </div>
                      <div className="text-left sm:text-right text-xs space-y-1">
                        <p className="font-serif text-xl text-[#102D25]">
                          {formatMinorCurrency(b.total_amount_minor, b.currency_code)}
                        </p>
                        <p className="uppercase tracking-[0.14em] text-[#788078]">
                          Booking: {b.status} · Payment: {b.payment_status}
                        </p>
                      </div>
                    </div>

                    {b.booking_items && b.booking_items.length > 0 && (
                      <ul className="divide-y divide-[#E7E4DA] text-sm">
                        {b.booking_items.map((item) => (
                          <li key={item.id} className="py-2.5 flex justify-between gap-4">
                            <span>
                              {item.service_title} ({item.service_date} · Qty {item.quantity})
                            </span>
                            <span className="tabular-nums font-medium">
                              {formatMinorCurrency(item.line_total_minor, b.currency_code)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {b.refunds && b.refunds.length > 0 && (
                      <div className="p-3 bg-[#F6F4ED] border border-[#E7E4DA] text-xs space-y-1">
                        {b.refunds.map((ref) => (
                          <p key={ref.id}>
                            <strong>Refund {ref.status}:</strong>{' '}
                            {formatMinorCurrency(ref.refund_amount_minor, ref.currency_code)}
                            {ref.provider_limitation_flagged
                              ? ' (Awaiting verified Pesepay split reversal rule)'
                              : ''}
                          </p>
                        ))}
                      </div>
                    )}

                    <div className="pt-2 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                      <input
                        type="text"
                        placeholder="Reason for cancellation or refund request"
                        value={reasonByBooking[b.id] || ''}
                        onChange={(e) =>
                          setReasonByBooking((prev) => ({ ...prev, [b.id]: e.target.value }))
                        }
                        className="flex-1 px-3 py-2 border border-[#E7E4DA] bg-[#F6F4ED] text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => void submitCancelRequest(b.id)}
                        className="px-4 py-2 border border-[#102D25] text-xs uppercase tracking-[0.14em] font-semibold text-[#102D25] hover:bg-[#102D25] hover:text-[#F6F4ED] cursor-pointer"
                      >
                        Request Cancellation
                      </button>
                      {b.payment_status === 'paid' && (
                        <button
                          type="button"
                          onClick={() => void submitRefundRequest(b)}
                          className="px-4 py-2 bg-[#102D25] text-[#F6F4ED] text-xs uppercase tracking-[0.14em] font-semibold cursor-pointer"
                        >
                          Request Refund
                        </button>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
