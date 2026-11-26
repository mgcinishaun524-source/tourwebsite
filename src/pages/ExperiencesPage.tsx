import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { IMAGE_ASSETS } from '../config/brand';
import { EXPERIENCES, EXPERIENCE_CATEGORIES, ExperienceCategory } from '../data/siteData';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { EditorialSectionHeader } from '../components/EditorialSectionHeader';
import { EmptyState } from '../components/EmptyState';
import { GlassButton } from '../components/GlassButton';
import { ResilientImage } from '../components/ResilientImage';
import { SegmentedFilterTabs } from '../components/SegmentedFilterTabs';
import { MaskRevealImage } from '../components/motion/MaskRevealImage';
import { SplitTextReveal } from '../components/motion/SplitTextReveal';
import { useFlipFilter } from '../hooks/useFlipFilter';

export function ExperiencesPage() {
  const [searchParams] = useSearchParams();
  const initialCatParam = searchParams.get('category');
  const isValidCat = EXPERIENCE_CATEGORIES.includes(initialCatParam as ExperienceCategory);

  const [selectedCategory, setSelectedCategory] = useState<'All' | ExperienceCategory>(
    isValidCat ? (initialCatParam as ExperienceCategory) : 'All'
  );
  const { containerRef, captureFlipState } = useFlipFilter(selectedCategory);

  useEffect(() => {
    if (isValidCat && initialCatParam) {
      setSelectedCategory(initialCatParam as ExperienceCategory);
    }
  }, [initialCatParam, isValidCat]);

  const handleCategoryChange = (val: string) => {
    captureFlipState();
    setSelectedCategory(val as 'All' | ExperienceCategory);
  };

  const filtered =
    selectedCategory === 'All'
      ? EXPERIENCES
      : EXPERIENCES.filter((exp) => exp.category === selectedCategory);

  const tabOptions = [
    { value: 'All', label: `All Experiences (${EXPERIENCES.length})` },
    ...EXPERIENCE_CATEGORIES.map((category) => ({ value: category, label: category })),
  ];

  return (
    <div>
      {/* Asymmetric Split Editorial Hero */}
      <section className="pt-32 pb-16 lg:pt-40 lg:pb-24 bg-[#102D25] text-[#F6F4ED] overflow-hidden">
        <div className="mx-auto max-w-[1380px] px-6 sm:px-10 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          <div className="lg:col-span-6 space-y-6">
            <Breadcrumbs theme="dark" items={[{ label: 'Experiences' }]} />
            <span className="block text-xs uppercase tracking-[0.22em] text-[#D9C397]">
              Curated Activities · Transend Tours
            </span>
            <SplitTextReveal
              as="h1"
              mode="words"
              trigger="mount"
              text="Experiences Across Falls, River & Bush"
              className="font-serif text-4xl sm:text-5xl lg:text-[3.75rem] font-normal leading-[1.08]"
            />
            <p className="text-base sm:text-lg text-[#F6F4ED]/80 leading-relaxed max-w-xl">
              Explore guided rainforest walks, scenic helicopter sweeps, Zambezi river voyages, white-water expeditions, wildlife safaris, and cultural encounters.
            </p>
            <div className="pt-2 border-t border-[#FFFFFF]/12 text-xs text-[#D9C397]/85">
              Indicative durations and seasonal notes below are placeholders confirmed upon enquiry.
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="aspect-[4/3] lg:aspect-[5/4] overflow-hidden border border-[#FFFFFF]/14 bg-[#18392F]">
              <MaskRevealImage
                src={IMAGE_ASSETS.helicopterFlight}
                alt="Helicopter flight above Transend Tours canyon"
                variant="iris"
                priority
                className="w-full h-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Filter Bar & Mixed-Proportion Editorial Experience Catalogue (Zero generic 3-col grid) */}
      <section className="py-16 lg:py-24 bg-[#F6F4ED]">
        <div className="mx-auto max-w-[1380px] px-6 sm:px-10">
          <div className="mb-14 pb-6 border-b border-[#E7E4DA]">
            <SegmentedFilterTabs
              options={tabOptions}
              value={selectedCategory}
              onChange={handleCategoryChange}
              ariaLabel="Experience categories"
              layoutId="experiences-filter-pill"
            />
          </div>

          {filtered.length > 0 ? (
            <div ref={containerRef} className="space-y-14 lg:space-y-20">
              {filtered.map((exp, idx) => {
                const isLead = idx === 0;
                const reverse = idx % 2 === 1;

                if (isLead) {
                  return (
                    <article
                      key={exp.slug}
                      data-flip-item
                      className="group grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center pb-14 border-b border-[#E7E4DA]"
                    >
                      <Link
                        to={`/experiences/${exp.slug}`}
                        className="lg:col-span-7 block aspect-[16/9] overflow-hidden border border-[#E7E4DA] bg-[#102D25]"
                      >
                        <ResilientImage
                          src={exp.image}
                          alt={exp.imageAlt}
                          className="w-full h-full"
                          imgClassName="w-full h-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03]"
                        />
                      </Link>
                      <div className="lg:col-span-5 space-y-5">
                        <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.16em] text-[#244B3A] font-semibold">
                          <span className="tabular-nums">01</span>
                          <span aria-hidden="true">·</span>
                          <span>{exp.category}</span>
                          <span aria-hidden="true">·</span>
                          <span>{exp.locationLabel}</span>
                        </div>
                        <h2 className="font-serif text-3xl sm:text-4xl font-normal text-[#102D25] leading-snug">
                          <Link
                            to={`/experiences/${exp.slug}`}
                            className="hover:text-[#244B3A] transition-colors"
                          >
                            {exp.name}
                          </Link>
                        </h2>
                        <p className="text-base text-[#26342D] leading-relaxed">{exp.shortDescription}</p>
                        <p className="text-xs text-[#788078]">{exp.seasonalityPlaceholder}</p>
                        <div className="pt-2 flex flex-wrap items-center gap-4">
                          <GlassButton to={`/experiences/${exp.slug}`} variant="forest">
                            <span>Inspect Experience</span>
                            <ArrowRight className="w-4 h-4 stroke-[1.5]" aria-hidden="true" />
                          </GlassButton>
                          <Link
                            to={`/book?interest=${encodeURIComponent(exp.name)}`}
                            className="text-xs uppercase tracking-[0.16em] font-semibold text-[#244B3A] hover:text-[#102D25]"
                          >
                            Enquire Now
                          </Link>
                        </div>
                      </div>
                    </article>
                  );
                }

                return (
                  <article
                    key={exp.slug}
                    data-flip-item
                    className="group grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center pb-14 border-b border-[#E7E4DA]"
                  >
                    <Link
                      to={`/experiences/${exp.slug}`}
                      className={`lg:col-span-5 block aspect-[4/3] overflow-hidden border border-[#E7E4DA] bg-[#102D25] ${
                        reverse ? 'lg:order-2 lg:col-start-8' : ''
                      }`}
                    >
                      <ResilientImage
                        src={exp.image}
                        alt={exp.imageAlt}
                        className="w-full h-full"
                        imgClassName="w-full h-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
                      />
                    </Link>

                    <div
                      className={`lg:col-span-7 space-y-4 ${
                        reverse ? 'lg:order-1 lg:col-start-1' : ''
                      }`}
                    >
                      <div className="flex flex-wrap items-center gap-2 text-xs text-[#788078]">
                        <span className="uppercase tracking-[0.16em] text-[#244B3A] font-semibold tabular-nums">
                          0{idx + 1} · {exp.category}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{exp.locationLabel}</span>
                      </div>
                      <h2 className="font-serif text-2xl sm:text-3xl font-normal text-[#102D25] leading-snug">
                        <Link
                          to={`/experiences/${exp.slug}`}
                          className="hover:text-[#244B3A] transition-colors"
                        >
                          {exp.name}
                        </Link>
                      </h2>
                      <p className="text-sm sm:text-base text-[#788078] leading-relaxed max-w-xl">
                        {exp.overview}
                      </p>
                      <div className="pt-3 flex flex-wrap items-center justify-between gap-4 border-t border-[#E7E4DA] max-w-xl">
                        <span className="text-xs text-[#26342D]">{exp.durationPlaceholder}</span>
                        <Link
                          to={`/experiences/${exp.slug}`}
                          className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] font-semibold text-[#102D25] hover:text-[#244B3A]"
                        >
                          <span>Discover Details</span>
                          <ArrowRight
                            className="w-3.5 h-3.5 stroke-[1.5] transition-transform duration-200 group-hover:translate-x-1"
                            aria-hidden="true"
                          />
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title="No experiences in this filter"
              description="Reset the category filter to browse all Transend Tours experiences."
              actionLabel="View All Experiences"
              onReset={() => handleCategoryChange('All')}
            />
          )}
        </div>
      </section>

      {/* Enquiry Band */}
      <section className="py-16 lg:py-20 bg-[#FFFFFF] border-t border-[#E7E4DA]">
        <div className="mx-auto max-w-[1380px] px-6 sm:px-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <EditorialSectionHeader
            eyebrow="Tailored Combinations"
            title="Pair Multiple Experiences Into One Seamless Stay"
            subtitle="Our travel desk coordinates park fees, transfer timings, and seasonal river conditions around your preferred dates."
          />
          <GlassButton to="/book" variant="forest">
            <span>Enquire About Activities</span>
            <ArrowRight className="w-4 h-4 stroke-[1.5]" aria-hidden="true" />
          </GlassButton>
        </div>
      </section>
    </div>
  );
}
