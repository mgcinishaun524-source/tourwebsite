import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { IMAGE_ASSETS } from '../config/brand';
import {
  JOURNAL_ARTICLES,
  JOURNAL_CATEGORIES,
  JournalCategory,
} from '../data/siteData';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { EmptyState } from '../components/EmptyState';
import { ResilientImage } from '../components/ResilientImage';
import { SegmentedFilterTabs } from '../components/SegmentedFilterTabs';
import { MaskRevealImage } from '../components/motion/MaskRevealImage';
import { SplitTextReveal } from '../components/motion/SplitTextReveal';
import { useFlipFilter } from '../hooks/useFlipFilter';

export function JournalPage() {
  const [selectedCategory, setSelectedCategory] = useState<'All' | JournalCategory>('All');
  const { containerRef, captureFlipState } = useFlipFilter(selectedCategory);

  const handleCategoryChange = (val: string) => {
    captureFlipState();
    setSelectedCategory(val as 'All' | JournalCategory);
  };

  const leadArticle = JOURNAL_ARTICLES[0];
  const filteredArticles =
    selectedCategory === 'All'
      ? JOURNAL_ARTICLES
      : JOURNAL_ARTICLES.filter((a) => a.category === selectedCategory);

  const tabOptions = [
    { value: 'All', label: `All Dispatches (${JOURNAL_ARTICLES.length})` },
    ...JOURNAL_CATEGORIES.map((category) => ({ value: category, label: category })),
  ];

  return (
    <div>
      {/* Periodical Broadsheet Masthead on Warm Ivory */}
      <section className="pt-36 pb-12 lg:pt-44 lg:pb-16 bg-[#F6F4ED] text-[#102D25] border-b border-[#102D25]">
        <div className="mx-auto max-w-[1380px] px-6 sm:px-10 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Breadcrumbs theme="light" items={[{ label: 'Journal' }]} />
            <span className="text-xs uppercase tracking-[0.22em] text-[#244B3A] font-semibold">
              Seasonal Dispatches · Editorial Magazine
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end pt-4">
            <div className="lg:col-span-8">
              <SplitTextReveal
                as="h1"
                mode="words"
                trigger="mount"
                text="The Transend Tours Journal"
                className="font-serif text-4xl sm:text-6xl lg:text-[4.5rem] font-normal leading-[1.04] tracking-tight"
              />
            </div>
            <div className="lg:col-span-4 pb-1">
              <p className="text-sm sm:text-base text-[#788078] leading-relaxed">
                Essays on river seasonality, wildlife ecology, heritage crafts, and calm itinerary craft along the Zambezi.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Cover Feature Story */}
      <section className="py-16 lg:py-20 bg-[#FFFFFF] border-b border-[#E7E4DA]">
        <div className="mx-auto max-w-[1380px] px-6 sm:px-10">
          <article className="group grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            <Link
              to={`/journal/${leadArticle.slug}`}
              className="lg:col-span-7 block aspect-[16/10] overflow-hidden border border-[#E7E4DA] bg-[#102D25]"
            >
              <MaskRevealImage
                src={IMAGE_ASSETS.heroFalls}
                alt={leadArticle.imageAlt}
                variant="curtain"
                className="w-full h-full"
                imgClassName="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
                priority
              />
            </Link>

            <div className="lg:col-span-5 space-y-6">
              <div className="flex flex-wrap items-center gap-2 text-xs text-[#788078]">
                <span className="uppercase tracking-[0.18em] text-[#244B3A] font-semibold">
                  Cover Essay
                </span>
                <span aria-hidden="true">·</span>
                <span>{leadArticle.category}</span>
                <span aria-hidden="true">·</span>
                <span>{leadArticle.readTimePlaceholder}</span>
              </div>
              <h2 className="font-serif text-3xl sm:text-4xl font-normal text-[#102D25] leading-[1.15]">
                <Link
                  to={`/journal/${leadArticle.slug}`}
                  className="hover:text-[#244B3A] transition-colors"
                >
                  {leadArticle.title}
                </Link>
              </h2>
              <p className="text-base text-[#788078] leading-relaxed">{leadArticle.subtitle}</p>
              <blockquote className="py-4 border-y border-[#E7E4DA] font-serif italic text-lg text-[#102D25]">
                “{leadArticle.pullQuote}”
              </blockquote>
              <Link
                to={`/journal/${leadArticle.slug}`}
                className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] font-semibold text-[#102D25] pt-1"
              >
                <span>Read Cover Feature</span>
                <ArrowRight
                  className="w-4 h-4 stroke-[1.5] transition-transform duration-200 group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </Link>
            </div>
          </article>
        </div>
      </section>

      {/* Filter & Hairline-Separated Periodical Grid (No boxed card clutter) */}
      <section className="py-16 lg:py-24 bg-[#F6F4ED]">
        <div className="mx-auto max-w-[1380px] px-6 sm:px-10">
          <div className="mb-14 pb-6 border-b border-[#E7E4DA]">
            <SegmentedFilterTabs
              options={tabOptions}
              value={selectedCategory}
              onChange={handleCategoryChange}
              ariaLabel="Journal categories"
              layoutId="journal-filter-pill"
            />
          </div>

          {filteredArticles.length > 0 ? (
            <div ref={containerRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-14">
              {filteredArticles.map((article, idx) => (
                <article
                  key={article.slug}
                  data-flip-item
                  className="group flex flex-col pt-5 border-t border-[#102D25]/25"
                >
                  <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.16em] text-[#788078] mb-3">
                    <span className="text-[#244B3A] font-semibold">{article.category}</span>
                    <span className="tabular-nums">No. 0{idx + 1}</span>
                  </div>

                  <Link
                    to={`/journal/${article.slug}`}
                    className={`block overflow-hidden border border-[#E7E4DA] bg-[#102D25] mb-5 ${
                      idx % 3 === 1 ? 'aspect-[4/5]' : 'aspect-[4/3]'
                    }`}
                  >
                    <ResilientImage
                      src={article.image}
                      alt={article.imageAlt}
                      className="w-full h-full"
                      imgClassName="w-full h-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
                    />
                  </Link>

                  <h3 className="font-serif text-2xl text-[#102D25] leading-snug mb-2.5">
                    <Link
                      to={`/journal/${article.slug}`}
                      className="hover:text-[#244B3A] transition-colors"
                    >
                      {article.title}
                    </Link>
                  </h3>

                  <p className="text-sm text-[#788078] leading-relaxed mb-5 flex-1">
                    {article.excerpt}
                  </p>

                  <div className="pt-3 border-t border-[#E7E4DA] flex items-center justify-between text-xs">
                    <span className="text-[#788078]">{article.readTimePlaceholder}</span>
                    <Link
                      to={`/journal/${article.slug}`}
                      className="inline-flex items-center gap-1.5 uppercase tracking-[0.16em] font-semibold text-[#102D25]"
                    >
                      <span>Read</span>
                      <ArrowRight
                        className="w-3.5 h-3.5 stroke-[1.5] transition-transform duration-200 group-hover:translate-x-1"
                        aria-hidden="true"
                      />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No dispatches in this section"
              description="Reset the editorial filter to view all published travel essays."
              onReset={() => handleCategoryChange('All')}
            />
          )}
        </div>
      </section>
    </div>
  );
}
