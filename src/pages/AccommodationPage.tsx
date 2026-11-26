import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { IMAGE_ASSETS } from '../config/brand';
import {
  ACCOMMODATIONS,
  ACCOMMODATION_CATEGORIES,
  AccommodationCategory,
} from '../data/siteData';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { EditorialSectionHeader } from '../components/EditorialSectionHeader';
import { EmptyState } from '../components/EmptyState';
import { GlassButton } from '../components/GlassButton';
import { ResilientImage } from '../components/ResilientImage';
import { SegmentedFilterTabs } from '../components/SegmentedFilterTabs';
import { MaskRevealImage } from '../components/motion/MaskRevealImage';
import { SplitTextReveal } from '../components/motion/SplitTextReveal';
import { useFlipFilter } from '../hooks/useFlipFilter';

export function AccommodationPage() {
  const [selectedType, setSelectedType] = useState<'All' | AccommodationCategory>('All');
  const { containerRef, captureFlipState } = useFlipFilter(selectedType);

  const handleTypeChange = (val: string) => {
    captureFlipState();
    setSelectedType(val as 'All' | AccommodationCategory);
  };

  const filtered =
    selectedType === 'All'
      ? ACCOMMODATIONS
      : ACCOMMODATIONS.filter((a) => a.type === selectedType);

  const tabOptions = [
    { value: 'All', label: `All Stays (${ACCOMMODATIONS.length})` },
    ...ACCOMMODATION_CATEGORIES.map((type) => ({ value: type, label: type })),
  ];

  return (
    <div>
      {/* Warm Ivory Architectural Gallery Header */}
      <section className="pt-36 pb-16 lg:pt-44 lg:pb-24 bg-[#F6F4ED] text-[#102D25] border-b border-[#E7E4DA]">
        <div className="mx-auto max-w-[1380px] px-6 sm:px-10 space-y-12">
          <Breadcrumbs theme="light" items={[{ label: 'Accommodation' }]} />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-end">
            <div className="lg:col-span-6 space-y-5">
              <span className="block text-xs uppercase tracking-[0.22em] text-[#244B3A] font-semibold">
                Sanctuary Collection · Demonstration Content
              </span>
              <SplitTextReveal
                as="h1"
                mode="words"
                trigger="mount"
                text="Lodges, Safari Camps & Heritage Stays"
                className="font-serif text-4xl sm:text-5xl lg:text-[3.75rem] font-normal leading-[1.08]"
              />
              <p className="text-base text-[#788078] leading-relaxed max-w-xl">
                Explore architectural accommodation tiers across Transend Tours and the Zambezi riverbank. All listings below serve as clearly labelled demonstration samples pending confirmed hospitality partner agreements.
              </p>
            </div>

            <div className="lg:col-span-6 aspect-[16/10] overflow-hidden border border-[#E7E4DA] bg-[#102D25]">
              <MaskRevealImage
                src={IMAGE_ASSETS.safariCamp}
                alt="Elevated luxury safari tent suite overlooking the Zambezi River"
                variant="iris"
                priority
                className="w-full h-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Hospitality Suites Showcase (Zero generic 3-col cards) */}
      <section className="py-16 lg:py-24 bg-[#FFFFFF]">
        <div className="mx-auto max-w-[1380px] px-6 sm:px-10">
          <div className="mb-14 pb-6 border-b border-[#E7E4DA] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <SegmentedFilterTabs
              options={tabOptions}
              value={selectedType}
              onChange={handleTypeChange}
              ariaLabel="Accommodation categories"
              layoutId="accommodation-filter-pill"
            />
            <span className="text-xs uppercase tracking-[0.16em] text-[#788078] tabular-nums">
              {filtered.length} Sanctuary Tier{filtered.length === 1 ? '' : 's'}
            </span>
          </div>

          {filtered.length > 0 ? (
            <div ref={containerRef} className="space-y-20">
              {filtered.map((item, idx) => {
                const reverse = idx % 2 === 1;
                return (
                  <article
                    key={item.slug}
                    data-flip-item
                    className="group grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center pb-16 border-b border-[#E7E4DA] last:border-b-0 last:pb-0"
                  >
                    <Link
                      to={`/accommodation/${item.slug}`}
                      className={`lg:col-span-7 block aspect-[16/10] overflow-hidden border border-[#E7E4DA] bg-[#102D25] ${
                        reverse ? 'lg:order-2' : ''
                      }`}
                    >
                      <ResilientImage
                        src={item.image}
                        alt={item.imageAlt}
                        className="w-full h-full"
                        imgClassName="w-full h-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03]"
                      />
                    </Link>

                    <div
                      className={`lg:col-span-5 space-y-5 ${reverse ? 'lg:order-1' : ''}`}
                    >
                      <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.18em] text-[#244B3A] font-semibold">
                        <span className="tabular-nums">0{idx + 1}</span>
                        <span aria-hidden="true">·</span>
                        <span>{item.type}</span>
                      </div>

                      <h2 className="font-serif text-3xl sm:text-4xl font-normal text-[#102D25] leading-snug">
                        <Link
                          to={`/accommodation/${item.slug}`}
                          className="hover:text-[#244B3A] transition-colors"
                        >
                          {item.name}
                        </Link>
                      </h2>

                      <p className="text-xs text-[#788078]">{item.location}</p>
                      <p className="text-sm sm:text-base text-[#26342D] leading-relaxed">
                        {item.editorialOverview}
                      </p>

                      <ul className="space-y-2 pt-3 border-t border-[#E7E4DA] text-xs text-[#788078]">
                        {item.facilitiesPlaceholder.slice(0, 3).map((fac, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-[#244B3A]" aria-hidden="true">
                              —
                            </span>
                            <span>{fac}</span>
                          </li>
                        ))}
                      </ul>

                      <div className="pt-4 border-t border-[#E7E4DA] flex flex-wrap items-center justify-between gap-4">
                        <span className="text-xs text-[#26342D]">{item.pricePlaceholder}</span>
                        <GlassButton to={`/accommodation/${item.slug}`} variant="forest" className="px-5 py-2.5 text-xs">
                          <span>View Stay</span>
                          <ArrowRight className="w-3.5 h-3.5 stroke-[1.5]" aria-hidden="true" />
                        </GlassButton>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title="No sample properties in this category"
              description="Reset the filter to view all demonstration accommodation tiers."
              onReset={() => handleTypeChange('All')}
            />
          )}
        </div>
      </section>

      {/* Enquiry Matchmaking */}
      <section className="py-16 lg:py-20 bg-[#102D25] text-[#F6F4ED]">
        <div className="mx-auto max-w-[1380px] px-6 sm:px-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <EditorialSectionHeader
            theme="dark"
            eyebrow="Personal Matchmaking"
            title="Need Guidance Selecting Riverfront vs. Town Stays?"
            subtitle="Tell us your desired atmosphere, suite configuration, and travel dates to receive verified partner options."
          />
          <GlassButton to="/book" variant="ivory">
            <span>Enquire About Stays</span>
            <ArrowRight className="w-4 h-4 stroke-[1.5]" aria-hidden="true" />
          </GlassButton>
        </div>
      </section>
    </div>
  );
}
