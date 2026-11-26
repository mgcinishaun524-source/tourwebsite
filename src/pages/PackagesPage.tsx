import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { IMAGE_ASSETS } from '../config/brand';
import { PACKAGES, PackageCategory } from '../data/siteData';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { EditorialSectionHeader } from '../components/EditorialSectionHeader';
import { EmptyState } from '../components/EmptyState';
import { GlassButton } from '../components/GlassButton';
import { ResilientImage } from '../components/ResilientImage';
import { SegmentedFilterTabs } from '../components/SegmentedFilterTabs';
import { MaskRevealImage } from '../components/motion/MaskRevealImage';
import { SplitTextReveal } from '../components/motion/SplitTextReveal';
import { useFlipFilter } from '../hooks/useFlipFilter';

const PACKAGE_CATEGORIES: PackageCategory[] = [
  'Adventure',
  'Romantic Getaways',
  'Family Experiences',
  'Safari Packages',
  'Custom Itineraries',
];

export function PackagesPage() {
  const [selectedCategory, setSelectedCategory] = useState<'All' | PackageCategory>('All');
  const { containerRef, captureFlipState } = useFlipFilter(selectedCategory);

  const handleCategoryChange = (val: string) => {
    captureFlipState();
    setSelectedCategory(val as 'All' | PackageCategory);
  };

  const filtered =
    selectedCategory === 'All'
      ? PACKAGES
      : PACKAGES.filter((p) => p.category === selectedCategory);

  const tabOptions = [
    { value: 'All', label: `All Packages (${PACKAGES.length})` },
    ...PACKAGE_CATEGORIES.map((category) => ({ value: category, label: category })),
  ];

  return (
    <div>
      {/* Centered Typographic Masthead Above Full-Bleed Architectural Plate */}
      <section className="pt-36 pb-16 lg:pt-44 lg:pb-20 bg-[#102D25] text-[#F6F4ED]">
        <div className="mx-auto max-w-[1380px] px-6 sm:px-10 space-y-12">
          <div className="flex justify-center">
            <Breadcrumbs theme="dark" items={[{ label: 'Travel Packages' }]} />
          </div>

          <div className="text-center max-w-3xl mx-auto space-y-5">
            <span className="inline-block text-xs uppercase tracking-[0.26em] text-[#D9C397]">
              Signature Journey Frameworks
            </span>
            <SplitTextReveal
              as="h1"
              mode="words"
              trigger="mount"
              text="Multi-Day Travel Packages"
              className="font-serif text-4xl sm:text-6xl lg:text-[4.2rem] font-normal leading-[1.06]"
            />
            <p className="text-base sm:text-lg text-[#F6F4ED]/80 leading-relaxed max-w-2xl mx-auto">
              Thoughtfully structured sample itineraries combining lodges, river voyages, flights, and wildlife drives. Inclusions, exclusions, and seasonal rates are placeholders confirmed per bespoke proposal.
            </p>
          </div>

          <div className="aspect-[21/9] overflow-hidden border border-[#FFFFFF]/14 bg-[#18392F]">
            <MaskRevealImage
              src={IMAGE_ASSETS.luxuryLodge}
              alt="Riverfront lodge deck overlooking the Zambezi at twilight"
              variant="curtain"
              priority
              className="w-full h-full"
            />
          </div>
        </div>
      </section>

      {/* Filter Bar & Alternating Full-Width Itinerary Dossiers (Zero repetitive 3-col grid) */}
      <section className="py-16 lg:py-24 bg-[#F6F4ED]">
        <div className="mx-auto max-w-[1380px] px-6 sm:px-10">
          <div className="mb-14 pb-6 border-b border-[#E7E4DA] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <SegmentedFilterTabs
              options={tabOptions}
              value={selectedCategory}
              onChange={handleCategoryChange}
              ariaLabel="Package categories"
              layoutId="packages-filter-pill"
            />
            <span className="text-xs uppercase tracking-[0.16em] text-[#788078] tabular-nums">
              {filtered.length} Framework{filtered.length === 1 ? '' : 's'}
            </span>
          </div>

          {filtered.length > 0 ? (
            <div ref={containerRef} className="space-y-16 lg:space-y-24">
              {filtered.map((pkg, idx) => {
                const reverse = idx % 2 === 1;
                return (
                  <article
                    key={pkg.slug}
                    data-flip-item
                    className="group grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch"
                  >
                    <Link
                      to={`/packages/${pkg.slug}`}
                      className={`lg:col-span-7 block aspect-[16/10] lg:aspect-auto lg:min-h-[420px] overflow-hidden border border-[#E7E4DA] bg-[#102D25] ${
                        reverse ? 'lg:order-2' : ''
                      }`}
                    >
                      <ResilientImage
                        src={pkg.image}
                        alt={pkg.imageAlt}
                        className="w-full h-full"
                        imgClassName="w-full h-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03]"
                      />
                    </Link>

                    <div
                      className={`lg:col-span-5 bg-[#FFFFFF] border border-[#E7E4DA] p-8 sm:p-10 flex flex-col justify-between gap-8 ${
                        reverse ? 'lg:order-1' : ''
                      }`}
                    >
                      <div className="space-y-5">
                        <div className="flex items-center justify-between text-xs uppercase tracking-[0.18em]">
                          <span className="text-[#244B3A] font-semibold">
                            0{idx + 1} · {pkg.category}
                          </span>
                          <span className="text-[#788078] tabular-nums">{pkg.duration}</span>
                        </div>

                        <h2 className="font-serif text-3xl text-[#102D25] leading-snug">
                          <Link
                            to={`/packages/${pkg.slug}`}
                            className="hover:text-[#244B3A] transition-colors"
                          >
                            {pkg.name}
                          </Link>
                        </h2>

                        <p className="text-sm text-[#788078] leading-relaxed">{pkg.overview}</p>

                        <ul className="space-y-2 pt-4 border-t border-[#E7E4DA] text-xs text-[#26342D]">
                          {pkg.highlights.slice(0, 3).map((item, i) => (
                            <li key={i} className="flex items-start gap-2.5 leading-relaxed">
                              <span className="text-[#244B3A]" aria-hidden="true">
                                —
                              </span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="pt-5 border-t border-[#E7E4DA] space-y-4">
                        <p className="text-xs text-[#788078]">{pkg.pricePlaceholder}</p>
                        <div className="flex flex-wrap items-center gap-3">
                          <GlassButton
                            to={`/packages/${pkg.slug}`}
                            variant="forest"
                            className="px-5 py-2.5 text-xs"
                          >
                            <span>View Itinerary</span>
                            <ArrowRight className="w-3.5 h-3.5 stroke-[1.5]" aria-hidden="true" />
                          </GlassButton>
                          <Link
                            to={`/book?interest=${encodeURIComponent(pkg.name)}`}
                            className="text-xs uppercase tracking-[0.15em] font-semibold text-[#102D25] hover:text-[#244B3A]"
                          >
                            Enquire
                          </Link>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title="No packages match this category"
              description="Reset the filter to explore all curated Transend Tours travel packages."
              onReset={() => handleCategoryChange('All')}
            />
          )}
        </div>
      </section>

      {/* Package Comparison Table */}
      <section className="py-16 lg:py-24 bg-[#FFFFFF] border-t border-[#E7E4DA]">
        <div className="mx-auto max-w-[1380px] px-6 sm:px-10 space-y-10">
          <EditorialSectionHeader
            variant="broadsheet"
            eyebrow="Itinerary Comparison"
            title="Compare Sample Travel Styles"
            subtitle="All durations, inclusions, and pricing tiers below serve as planning baselines prior to customised quotation."
          />

          <div className="overflow-x-auto border-y border-[#E7E4DA]">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-[#E7E4DA] text-xs uppercase tracking-[0.14em] text-[#244B3A]">
                  <th className="py-4 pr-5 font-semibold">Package</th>
                  <th className="py-4 px-5 font-semibold">Style</th>
                  <th className="py-4 px-5 font-semibold">Duration (Placeholder)</th>
                  <th className="py-4 px-5 font-semibold">Indicative Pricing</th>
                  <th className="py-4 pl-5 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7E4DA]">
                {PACKAGES.map((pkg) => (
                  <tr key={pkg.slug} className="hover:bg-[#F6F4ED]/50 transition-colors">
                    <td className="py-4 pr-5 font-serif text-base text-[#102D25] font-medium">
                      <Link to={`/packages/${pkg.slug}`} className="hover:underline">
                        {pkg.name}
                      </Link>
                    </td>
                    <td className="py-4 px-5 text-[#26342D]">{pkg.category}</td>
                    <td className="py-4 px-5 text-[#788078] tabular-nums">{pkg.duration}</td>
                    <td className="py-4 px-5 text-[#788078]">{pkg.pricePlaceholder}</td>
                    <td className="py-4 pl-5 text-right whitespace-nowrap">
                      <Link
                        to={`/book?interest=${encodeURIComponent(pkg.name)}`}
                        className="text-xs uppercase tracking-[0.14em] font-semibold text-[#102D25] hover:text-[#244B3A]"
                      >
                        Enquire
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Custom Itinerary CTA */}
      <section className="py-16 lg:py-20 bg-[#102D25] text-[#F6F4ED]">
        <div className="mx-auto max-w-[1380px] px-6 sm:px-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <EditorialSectionHeader
            theme="dark"
            eyebrow="Custom Itineraries"
            title="Looking for a Fully Bespoke Schedule?"
            subtitle="Combine preferred lodges, private transfers, and regional extensions in our multi-step enquiry builder."
          />
          <GlassButton to="/book" variant="ivory">
            <span>Design Custom Trip</span>
            <ArrowRight className="w-4 h-4 stroke-[1.5]" aria-hidden="true" />
          </GlassButton>
        </div>
      </section>
    </div>
  );
}
