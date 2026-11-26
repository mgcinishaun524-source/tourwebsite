import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, MapPin, Search, SlidersHorizontal, Star } from 'lucide-react';
import { apiFetch } from '../lib/apiClient';
import { formatMinorCurrency } from '../lib/money';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { EmptyState } from '../components/EmptyState';
import { ResilientImage } from '../components/ResilientImage';
import { SplitTextReveal } from '../components/motion/SplitTextReveal';

interface OperatorTour {
  id: string;
  slug: string;
  name: string;
  short_description: string;
  duration_label: string;
  price_minor: number;
  currency_code: string;
}

interface Operator {
  slug: string;
  cover_image_url: string | null;
  cover_image_alt: string | null;
  company_description: string;
  office_location: string | null;
  countries_served: string[];
  price_tier: string;
  price_min_per_person_per_day_minor: number | null;
  price_max_per_person_per_day_minor: number | null;
  currency_code: string;
  is_featured: boolean;
  supplier: { trading_name: string; country_code: string };
  destinations: Array<{ slug: string; name: string }>;
  categories: string[];
  tours: OperatorTour[];
  reviewCount: number;
  averageRating: number | null;
}

const COUNTRIES = ['Zimbabwe', 'Botswana', 'Zambia', 'Namibia', 'South Africa', 'Tanzania', 'Kenya', 'Rwanda', 'Uganda'];
const CATEGORIES = ['Private safaris', 'Group safaris', 'Camping safaris', 'Luxury safaris', 'Wildlife safaris', 'Cultural tours', 'Adventure tours', 'Multi-country tours', 'Custom itineraries'];

export function OperatorDirectoryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [operators, setOperators] = useState<Operator[]>([]);
  const [destinations, setDestinations] = useState<Array<{ slug: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const search = searchParams.get('search') ?? '';
  const country = searchParams.get('country') ?? '';
  const destination = searchParams.get('destination') ?? '';
  const priceTier = searchParams.get('priceTier') ?? '';
  const category = searchParams.get('category') ?? '';
  const rating = searchParams.get('rating') ?? '';
  const sort = searchParams.get('sort') ?? 'recommended';

  useEffect(() => {
    setLoading(true);
    setError(null);
    apiFetch<{ operators: Operator[]; destinations: Array<{ slug: string; name: string }> }>(
      `/api/operators?${searchParams.toString()}`,
    )
      .then((data) => {
        setOperators(data.operators ?? []);
        setDestinations(data.destinations ?? []);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load safari operators.'))
      .finally(() => setLoading(false));
  }, [searchParams]);

  function updateFilter(key: string, value: string) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next);
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    updateFilter('search', String(form.get('search') ?? '').trim());
  }

  const activeFilterCount = useMemo(
    () => [country, destination, priceTier, category, rating].filter(Boolean).length,
    [country, destination, priceTier, category, rating],
  );

  return (
    <div className="bg-[#F6F4ED]">
      <section className="pt-32 pb-16 lg:pt-40 lg:pb-20 bg-[#102D25] text-[#F6F4ED]">
        <div className="mx-auto max-w-[1380px] px-6 sm:px-10">
          <Breadcrumbs theme="dark" items={[{ label: 'Safari Tour Operators' }]} />
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
            <div className="lg:col-span-8">
              <span className="block text-xs uppercase tracking-[0.22em] text-[#D9C397] mb-5">Africa · Operators · Journeys</span>
              <SplitTextReveal as="h1" mode="words" trigger="mount" text="Explore Safari Tour Operators" className="font-serif text-4xl sm:text-5xl lg:text-[4.25rem] leading-[1.05]" />
            </div>
            <p className="lg:col-span-4 text-base sm:text-lg text-[#F6F4ED]/75 leading-relaxed">
              Discover trusted safari specialists, experienced tour operators and travel companies offering unforgettable African experiences.
            </p>
          </div>
        </div>
      </section>

      <section className="py-10 lg:py-16">
        <div className="mx-auto max-w-[1380px] px-6 sm:px-10">
          <div className="flex flex-col lg:flex-row gap-3 mb-8">
            <form onSubmit={submitSearch} className="flex-1 flex border border-[#E7E4DA] bg-white">
              <label htmlFor="operator-search" className="sr-only">Search operators</label>
              <Search className="w-5 h-5 m-4 text-[#788078]" aria-hidden="true" />
              <input id="operator-search" name="search" defaultValue={search} placeholder="Company, country, destination or safari experience" className="w-full py-4 pr-4 outline-none text-[#26342D] bg-transparent" />
              <button type="submit" className="px-5 text-xs uppercase tracking-[0.14em] font-semibold text-[#244B3A] cursor-pointer">Search</button>
            </form>
            <select aria-label="Sort operators" value={sort} onChange={(event) => updateFilter('sort', event.target.value)} className="border border-[#E7E4DA] bg-white px-4 py-4 text-sm text-[#26342D]">
              <option value="recommended">Recommended</option>
              <option value="highest-rated">Highest rated</option>
              <option value="most-reviewed">Most reviewed</option>
              <option value="lowest-price">Lowest starting price</option>
              <option value="highest-price">Highest starting price</option>
              <option value="recent">Recently added</option>
            </select>
            <button type="button" onClick={() => setFiltersOpen((open) => !open)} className="lg:hidden flex items-center justify-between border border-[#E7E4DA] bg-white px-4 py-4 text-sm cursor-pointer">
              <span className="inline-flex items-center gap-2"><SlidersHorizontal className="w-4 h-4" /> Filters {activeFilterCount ? `(${activeFilterCount})` : ''}</span>
              <span>{filtersOpen ? '−' : '+'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)] gap-8 lg:gap-12">
            <aside className={`${filtersOpen ? 'block' : 'hidden'} lg:block border-y lg:border border-[#E7E4DA] lg:p-5 h-fit`}>
              <FilterSelect label="Country of operation" value={country} options={COUNTRIES} onChange={(value) => updateFilter('country', value)} />
              <FilterSelect label="Destination" value={destination} options={destinations.map((item) => item.name)} optionValues={destinations.map((item) => item.slug)} onChange={(value) => updateFilter('destination', value)} />
              <FilterSelect label="Price range" value={priceTier} options={['Budget', 'Mid-range', 'Luxury', 'Custom']} optionValues={['budget', 'mid-range', 'luxury', 'custom']} onChange={(value) => updateFilter('priceTier', value)} />
              <FilterSelect label="Tour type" value={category} options={CATEGORIES} onChange={(value) => updateFilter('category', value)} />
              <FilterSelect label="Operator rating" value={rating} options={['4 stars & above', '3 stars & above']} optionValues={['4', '3']} onChange={(value) => updateFilter('rating', value)} />
              {activeFilterCount > 0 && (
                <button type="button" onClick={() => setSearchParams({ sort })} className="mt-4 text-xs uppercase tracking-[0.14em] font-semibold text-[#244B3A] underline cursor-pointer">Clear filters</button>
              )}
            </aside>

            <div>
              {loading ? (
                <div className="min-h-64 flex items-center justify-center text-sm uppercase tracking-[0.16em] text-[#788078]">Loading operators</div>
              ) : error ? (
                <EmptyState title="Directory unavailable" description={error} actionLabel="Try again" actionTo="/operators" />
              ) : operators.length === 0 ? (
                <EmptyState title="No safari operators found" description="There are no published matches yet. Try clearing a filter or checking back as approved operators join the marketplace." actionLabel="Clear search" actionTo="/operators" />
              ) : (
                <div className="space-y-10">
                  {operators.map((operator) => (
                    <article key={operator.slug} className="group grid grid-cols-1 md:grid-cols-[280px_minmax(0,1fr)] border-b border-[#E7E4DA] pb-10 gap-6">
                      <Link to={`/operators/${operator.slug}`} className="block aspect-[4/3] md:aspect-[5/4] overflow-hidden bg-[#18392F]">
                        {operator.cover_image_url ? (
                          <ResilientImage src={operator.cover_image_url} alt={operator.cover_image_alt || `${operator.supplier.trading_name} safari experience`} className="w-full h-full" imgClassName="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
                        ) : (
                          <div className="w-full h-full flex items-end p-5 bg-[#18392F] text-[#D9C397] font-serif text-2xl">{operator.supplier.trading_name}</div>
                        )}
                      </Link>
                      <div className="min-w-0 space-y-4">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            {operator.is_featured && <span className="block text-[10px] uppercase tracking-[0.18em] text-[#244B3A] mb-2">Featured operator</span>}
                            <h2 className="font-serif text-3xl text-[#102D25]"><Link to={`/operators/${operator.slug}`} className="hover:text-[#244B3A]">{operator.supplier.trading_name}</Link></h2>
                          </div>
                          {operator.averageRating !== null && (
                            <span className="inline-flex items-center gap-1 text-sm text-[#26342D]"><Star className="w-4 h-4 fill-[#D9C397] text-[#D9C397]" /> {operator.averageRating.toFixed(1)} <span className="text-[#788078]">({operator.reviewCount})</span></span>
                          )}
                        </div>
                        <p className="text-sm text-[#788078] inline-flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {operator.office_location || operator.supplier.country_code}</p>
                        <p className="text-[#26342D] leading-relaxed line-clamp-3">{operator.company_description}</p>
                        <div className="flex flex-wrap gap-2 text-xs">
                          {operator.destinations.slice(0, 4).map((item) => <span key={item.slug} className="border border-[#E7E4DA] px-2.5 py-1.5">{item.name}</span>)}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                          <div>
                            <span className="block text-[10px] uppercase tracking-[0.16em] text-[#788078]">Starting price</span>
                            <strong className="text-sm text-[#102D25]">{operator.price_min_per_person_per_day_minor !== null ? `${formatMinorCurrency(operator.price_min_per_person_per_day_minor, operator.currency_code)} / person / day` : 'On request'}</strong>
                          </div>
                          <div>
                            <span className="block text-[10px] uppercase tracking-[0.16em] text-[#788078]">Published tours</span>
                            <strong className="text-sm text-[#102D25]">{operator.tours.length}</strong>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-5 pt-2">
                          <Link to={`/operators/${operator.slug}`} className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.15em] font-semibold text-[#244B3A]">View Operator <ArrowRight className="w-4 h-4" /></Link>
                          <Link to={`/operators/${operator.slug}#tours`} className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.15em] font-semibold text-[#244B3A]">Explore Tours <ArrowRight className="w-4 h-4" /></Link>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function FilterSelect({ label, value, options, optionValues, onChange }: { label: string; value: string; options: string[]; optionValues?: string[]; onChange: (value: string) => void }) {
  return (
    <label className="block py-3 border-b border-[#E7E4DA] last:border-b-0">
      <span className="block text-[10px] uppercase tracking-[0.16em] font-semibold text-[#788078] mb-2">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="w-full bg-transparent py-1.5 text-sm outline-none">
        <option value="">All</option>
        {options.map((option, index) => <option key={optionValues?.[index] ?? option} value={optionValues?.[index] ?? option}>{option}</option>)}
      </select>
    </label>
  );
}
