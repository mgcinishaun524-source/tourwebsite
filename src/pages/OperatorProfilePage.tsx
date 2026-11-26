import { useEffect, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowRight, CalendarDays, CheckCircle2, MapPin, Star, Users } from 'lucide-react';
import { apiFetch } from '../lib/apiClient';
import { formatMinorCurrency } from '../lib/money';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { EmptyState } from '../components/EmptyState';
import { ResilientImage } from '../components/ResilientImage';

interface Tour {
  id: string;
  slug: string;
  name: string;
  short_description: string;
  overview: string;
  duration_label: string;
  price_minor: number;
  currency_code: string;
  min_guests: number;
  max_capacity: number;
  booking_conditions: string | null;
  cancellation_policy: string;
}

interface OperatorProfile {
  slug: string;
  cover_image_url: string | null;
  cover_image_alt: string | null;
  logo_url: string | null;
  company_description: string;
  office_location: string | null;
  countries_served: string[];
  price_tier: string;
  price_min_per_person_per_day_minor: number | null;
  price_max_per_person_per_day_minor: number | null;
  currency_code: string;
  supplier: { trading_name: string; country_code: string; business_email: string; business_phone: string; can_accept_paid_bookings: boolean };
  destinations: Array<{ slug: string; name: string; region_tag: string }>;
  categories: string[];
  tours: Tour[];
  reviews: Array<{ id: string; rating: number; comment: string; created_at: string }>;
  reviewCount: number;
  averageRating: number | null;
}

export function OperatorProfilePage() {
  const { slug } = useParams();
  const [operator, setOperator] = useState<OperatorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTour, setSelectedTour] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const [enquiryError, setEnquiryError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    apiFetch<{ operator: OperatorProfile }>(`/api/operators/${encodeURIComponent(slug)}`)
      .then((data) => setOperator(data.operator))
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load operator profile.'))
      .finally(() => setLoading(false));
  }, [slug]);

  async function submitEnquiry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);
    setEnquiryError(null);
    const form = new FormData(event.currentTarget);
    try {
      await apiFetch(`/api/operators/${encodeURIComponent(String(slug))}/enquiries`, {
        method: 'POST',
        body: {
          fullName: String(form.get('fullName') ?? ''),
          email: String(form.get('email') ?? ''),
          phone: String(form.get('phone') ?? ''),
          partySize: form.get('partySize') ? Number(form.get('partySize')) : undefined,
          preferredDate: String(form.get('preferredDate') ?? '') || undefined,
          experienceId: selectedTour || undefined,
          message: String(form.get('message') ?? ''),
        },
      });
      setNotice('Your enquiry has been sent to the operator.');
      event.currentTarget.reset();
      setSelectedTour('');
    } catch (err) {
      setEnquiryError(err instanceof Error ? err.message : 'Unable to send enquiry.');
    }
  }

  if (loading) {
    return <div className="min-h-[70vh] pt-36 pb-24 flex items-center justify-center text-[#788078] text-sm uppercase tracking-[0.16em]">Loading operator profile</div>;
  }
  if (error || !operator) {
    return (
      <div className="pt-36 pb-24 px-6">
        <EmptyState title="Operator profile unavailable" description={error ?? 'This operator is not currently published.'} actionLabel="Browse operators" actionTo="/operators" />
      </div>
    );
  }

  return (
    <div className="bg-[#F6F4ED]">
      <section className="pt-32 pb-10 lg:pt-40 lg:pb-14 bg-[#102D25] text-[#F6F4ED]">
        <div className="mx-auto max-w-[1380px] px-6 sm:px-10">
          <Breadcrumbs theme="dark" items={[{ label: 'Safari Tour Operators', to: '/operators' }, { label: operator.supplier.trading_name }]} />
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
            <div className="lg:col-span-8">
              <div className="flex flex-wrap items-center gap-3 mb-5">
                {operator.supplier.can_accept_paid_bookings && <span className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.14em] text-[#D9C397]"><CheckCircle2 className="w-4 h-4" /> Approved operator</span>}
                {operator.averageRating !== null && <span className="inline-flex items-center gap-1 text-sm"><Star className="w-4 h-4 fill-[#D9C397] text-[#D9C397]" /> {operator.averageRating.toFixed(1)} ({operator.reviewCount} verified reviews)</span>}
              </div>
              <h1 className="font-serif text-4xl sm:text-5xl lg:text-[4.25rem] leading-[1.05]">{operator.supplier.trading_name}</h1>
              <p className="mt-5 inline-flex items-center gap-2 text-[#F6F4ED]/75"><MapPin className="w-4 h-4" /> {operator.office_location || operator.supplier.country_code}</p>
            </div>
            {operator.logo_url && (
              <div className="lg:col-span-4 lg:justify-self-end">
                <img src={operator.logo_url} alt={`${operator.supplier.trading_name} approved logo`} className="max-h-20 max-w-48 object-contain" />
              </div>
            )}
          </div>
        </div>
      </section>

      {operator.cover_image_url && (
        <section className="bg-[#102D25] px-6 sm:px-10 pb-10">
          <div className="mx-auto max-w-[1380px] aspect-[16/7] min-h-72 overflow-hidden">
            <ResilientImage src={operator.cover_image_url} alt={operator.cover_image_alt || `${operator.supplier.trading_name} safari`} className="w-full h-full" imgClassName="w-full h-full object-cover" />
          </div>
        </section>
      )}

      <section className="py-14 lg:py-20">
        <div className="mx-auto max-w-[1380px] px-6 sm:px-10 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
          <article className="lg:col-span-8 space-y-10">
            <div>
              <h2 className="font-serif text-3xl text-[#102D25] mb-5">About the operator</h2>
              <p className="text-base leading-[1.85] whitespace-pre-line">{operator.company_description}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 border-y border-[#E7E4DA] py-8">
              <div>
                <span className="block text-[10px] uppercase tracking-[0.16em] text-[#788078] mb-3">Destinations served</span>
                <div className="flex flex-wrap gap-2">{operator.destinations.map((item) => <span key={item.slug} className="text-sm border border-[#E7E4DA] px-3 py-2">{item.name}</span>)}</div>
              </div>
              <div>
                <span className="block text-[10px] uppercase tracking-[0.16em] text-[#788078] mb-3">Safari specialities</span>
                <div className="flex flex-wrap gap-2">{operator.categories.map((category) => <span key={category} className="text-sm border border-[#E7E4DA] px-3 py-2">{category}</span>)}</div>
              </div>
            </div>
          </article>
          <aside className="lg:col-span-4 border border-[#E7E4DA] p-6 h-fit bg-white">
            <span className="block text-[10px] uppercase tracking-[0.16em] text-[#788078] mb-2">Indicative price</span>
            <p className="font-serif text-2xl text-[#102D25] mb-6">
              {operator.price_min_per_person_per_day_minor !== null
                ? `${formatMinorCurrency(operator.price_min_per_person_per_day_minor, operator.currency_code)} / person / day`
                : 'Price on request'}
            </p>
            <dl className="space-y-4 text-sm border-t border-[#E7E4DA] pt-5">
              <div className="flex justify-between gap-4"><dt className="text-[#788078]">Office</dt><dd className="text-right">{operator.office_location || operator.supplier.country_code}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-[#788078]">Countries</dt><dd className="text-right">{operator.countries_served.join(', ') || '—'}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-[#788078]">Tours</dt><dd>{operator.tours.length} published</dd></div>
            </dl>
          </aside>
        </div>
      </section>

      <section id="tours" className="py-14 lg:py-20 border-t border-[#E7E4DA]">
        <div className="mx-auto max-w-[1380px] px-6 sm:px-10">
          <div className="mb-10">
            <span className="block text-xs uppercase tracking-[0.18em] text-[#244B3A] mb-3">Available journeys</span>
            <h2 className="font-serif text-4xl text-[#102D25]">Tours by {operator.supplier.trading_name}</h2>
          </div>
          {operator.tours.length === 0 ? (
            <EmptyState title="No published tours yet" description="This approved operator has not published bookable tours." actionLabel="Enquire with operator" actionTo="#enquiry" />
          ) : (
            <div className="space-y-6">
              {operator.tours.map((tour) => (
                <article key={tour.id} className="grid grid-cols-1 lg:grid-cols-12 gap-6 border border-[#E7E4DA] bg-white p-6">
                  <div className="lg:col-span-8">
                    <h3 className="font-serif text-2xl text-[#102D25]">{tour.name}</h3>
                    <p className="mt-3 text-sm text-[#26342D] leading-relaxed">{tour.short_description}</p>
                    <div className="mt-5 flex flex-wrap gap-5 text-xs text-[#788078]">
                      <span className="inline-flex items-center gap-1.5"><CalendarDays className="w-4 h-4" /> {tour.duration_label}</span>
                      <span className="inline-flex items-center gap-1.5"><Users className="w-4 h-4" /> {tour.min_guests}–{tour.max_capacity} guests</span>
                    </div>
                  </div>
                  <div className="lg:col-span-4 lg:text-right flex flex-col items-start lg:items-end justify-between">
                    <div><span className="block text-[10px] uppercase tracking-[0.16em] text-[#788078]">Starting from</span><strong className="font-serif text-2xl text-[#102D25]">{formatMinorCurrency(tour.price_minor, tour.currency_code)}</strong></div>
                    {operator.supplier.can_accept_paid_bookings ? (
                      <Link to={`/checkout?interest=${encodeURIComponent(tour.name)}`} className="mt-5 inline-flex items-center gap-2 text-xs uppercase tracking-[0.15em] font-semibold text-[#244B3A]">Check availability <ArrowRight className="w-4 h-4" /></Link>
                    ) : (
                      <button type="button" onClick={() => { setSelectedTour(tour.id); document.querySelector('#enquiry')?.scrollIntoView({ behavior: 'smooth' }); }} className="mt-5 text-xs uppercase tracking-[0.15em] font-semibold text-[#244B3A] cursor-pointer">Enquire <ArrowRight className="w-4 h-4 inline" /></button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <section id="enquiry" className="py-14 lg:py-20 bg-[#18392F] text-[#F6F4ED]">
        <div className="mx-auto max-w-[1380px] px-6 sm:px-10 grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-4">
            <span className="block text-xs uppercase tracking-[0.18em] text-[#D9C397] mb-4">Direct enquiry</span>
            <h2 className="font-serif text-4xl">Plan your journey</h2>
            <p className="mt-4 text-sm text-[#F6F4ED]/70 leading-relaxed">Contact {operator.supplier.trading_name} directly through the marketplace. Enquiries do not create confirmed bookings or charges.</p>
          </div>
          <form onSubmit={submitEnquiry} className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input name="fullName" required minLength={2} placeholder="Full name" className="bg-[#FFFFFF] text-[#26342D] px-4 py-3.5 outline-none" />
            <input name="email" required type="email" placeholder="Email address" className="bg-[#FFFFFF] text-[#26342D] px-4 py-3.5 outline-none" />
            <input name="phone" placeholder="Phone (optional)" className="bg-[#FFFFFF] text-[#26342D] px-4 py-3.5 outline-none" />
            <input name="partySize" type="number" min={1} max={30} placeholder="Travellers" className="bg-[#FFFFFF] text-[#26342D] px-4 py-3.5 outline-none" />
            <input name="preferredDate" type="date" className="bg-[#FFFFFF] text-[#26342D] px-4 py-3.5 outline-none" />
            <select value={selectedTour} onChange={(event) => setSelectedTour(event.target.value)} className="bg-[#FFFFFF] text-[#26342D] px-4 py-3.5 outline-none">
              <option value="">General enquiry</option>
              {operator.tours.map((tour) => <option key={tour.id} value={tour.id}>{tour.name}</option>)}
            </select>
            <textarea name="message" required minLength={10} rows={5} placeholder="Tell the operator about your interests..." className="sm:col-span-2 bg-[#FFFFFF] text-[#26342D] px-4 py-3.5 outline-none resize-y" />
            {notice && <p className="sm:col-span-2 text-sm text-[#D9C397]" role="status">{notice}</p>}
            {enquiryError && <p className="sm:col-span-2 text-sm text-red-200" role="alert">{enquiryError}</p>}
            <button type="submit" className="sm:col-span-2 justify-self-start px-6 py-3.5 border border-[#D9C397] text-xs uppercase tracking-[0.16em] font-semibold cursor-pointer hover:bg-[#D9C397] hover:text-[#102D25] transition-colors">Send enquiry</button>
          </form>
        </div>
      </section>
    </div>
  );
}
