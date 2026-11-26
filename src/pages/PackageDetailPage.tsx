import { useParams } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { PACKAGES } from '../data/siteData';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { EditorialSectionHeader } from '../components/EditorialSectionHeader';
import { EmptyState } from '../components/EmptyState';
import { GlassButton } from '../components/GlassButton';
import { RelatedContent } from '../components/RelatedContent';
import { ResilientImage } from '../components/ResilientImage';
import { WhatsAppButton } from '../components/WhatsAppButton';
import { SplitTextReveal } from '../components/motion/SplitTextReveal';

export function PackageDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const pkg = PACKAGES.find((item) => item.slug === slug);

  if (!pkg) {
    return (
      <div className="pt-36 pb-24 px-6 bg-[#F6F4ED] min-h-[70vh]">
        <EmptyState
          title="Package Not Found"
          description="The requested travel package could not be found. Browse our signature journeys to find an inspiring framework."
          actionLabel="View All Packages"
          actionTo="/packages"
        />
      </div>
    );
  }

  const related = PACKAGES.filter((p) => p.slug !== pkg.slug)
    .slice(0, 3)
    .map((p) => ({
      slug: p.slug,
      title: p.name,
      kicker: `${p.category} · ${p.duration}`,
      summary: p.overview,
      image: p.image,
      imageAlt: p.imageAlt,
      to: `/packages/${p.slug}`,
    }));

  return (
    <div>
      {/* 50/50 Split Architectural Package Cover */}
      <section className="pt-28 lg:pt-0 bg-[#102D25] text-[#F6F4ED]">
        <div className="grid grid-cols-1 lg:grid-cols-12 lg:min-h-[82vh] items-stretch">
          <div className="lg:col-span-6 px-6 sm:px-10 lg:px-16 py-12 lg:pt-36 lg:pb-16 flex flex-col justify-between gap-10">
            <div className="space-y-6">
              <Breadcrumbs
                theme="dark"
                items={[
                  { label: 'Packages', to: '/packages' },
                  { label: pkg.name },
                ]}
              />
              <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.2em] text-[#D9C397]">
                <span>{pkg.category}</span>
                <span aria-hidden="true">·</span>
                <span>{pkg.duration}</span>
              </div>
              <SplitTextReveal
                as="h1"
                mode="words"
                trigger="mount"
                text={pkg.name}
                className="font-serif text-4xl sm:text-5xl lg:text-[3.5rem] font-normal leading-[1.08]"
              />
              <p className="text-base text-[#F6F4ED]/82 leading-relaxed max-w-xl">
                {pkg.overview}
              </p>
            </div>

            <div className="pt-6 border-t border-[#FFFFFF]/14 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-4 text-xs">
                <span className="uppercase tracking-[0.16em] text-[#D9C397]">
                  Indicative Seasonal Guidance
                </span>
                <span className="text-[#F6F4ED]">{pkg.pricePlaceholder}</span>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <GlassButton
                  to={`/book?interest=${encodeURIComponent(pkg.name)}`}
                  variant="ivory"
                >
                  <span>Enquire About This Package</span>
                  <ArrowRight className="w-4 h-4 stroke-[1.5]" aria-hidden="true" />
                </GlassButton>
                <WhatsAppButton
                  variant="glass"
                  message={`Hello, I would like a tailored proposal for ${pkg.name}.`}
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 relative aspect-[4/3] lg:aspect-auto bg-[#18392F] overflow-hidden">
            <ResilientImage
              src={pkg.image}
              alt={pkg.imageAlt}
              className="w-full h-full"
              priority
            />
          </div>
        </div>
      </section>

      {/* Itinerary Outline & Clean Hairline Inclusions/Exclusions */}
      <section className="py-16 lg:py-24 bg-[#F6F4ED]">
        <div className="mx-auto max-w-[1380px] px-6 sm:px-10 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          <div className="lg:col-span-8 space-y-14">
            <div className="space-y-4">
              <EditorialSectionHeader eyebrow="Editorial Concept" title="Journey Architecture" />
              <p className="text-base sm:text-[1.05rem] text-[#26342D] leading-[1.8] max-w-prose">
                {pkg.editorialIntro}
              </p>
            </div>

            {/* Day-by-Day Chronological Ledger */}
            <div className="space-y-6 pt-8 border-t border-[#E7E4DA]">
              <h2 className="font-serif text-2xl sm:text-3xl text-[#102D25]">
                Sample Itinerary Outline
              </h2>
              <div className="divide-y divide-[#E7E4DA] border-y border-[#E7E4DA]">
                {pkg.itineraryOutline.map((item) => (
                  <div key={item.day} className="py-6 grid grid-cols-1 sm:grid-cols-12 gap-4">
                    <span className="sm:col-span-3 text-xs uppercase tracking-[0.18em] font-semibold text-[#244B3A] pt-1 tabular-nums">
                      {item.day}
                    </span>
                    <div className="sm:col-span-9 space-y-1.5">
                      <h3 className="font-serif text-2xl text-[#102D25]">{item.title}</h3>
                      <p className="text-sm sm:text-base text-[#788078] leading-relaxed">
                        {item.summary}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Hairline Inclusions vs Exclusions Diptych */}
            <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-[#E7E4DA] border-y border-[#E7E4DA] bg-[#FFFFFF] px-6 sm:px-8">
              <div className="py-7 sm:pr-7 space-y-4">
                <h3 className="font-serif text-xl text-[#102D25]">
                  Indicative Inclusions (Placeholder)
                </h3>
                <ul className="space-y-2.5 text-sm text-[#26342D]">
                  {pkg.inclusionsPlaceholder.map((inc, i) => (
                    <li key={i} className="flex items-start gap-2.5 leading-relaxed">
                      <span className="text-[#244B3A]" aria-hidden="true">
                        +
                      </span>
                      <span>{inc}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="py-7 sm:pl-7 space-y-4">
                <h3 className="font-serif text-xl text-[#102D25]">
                  Typical Exclusions (Placeholder)
                </h3>
                <ul className="space-y-2.5 text-sm text-[#788078]">
                  {pkg.exclusionsPlaceholder.map((exc, i) => (
                    <li key={i} className="flex items-start gap-2.5 leading-relaxed">
                      <span className="text-[#788078]" aria-hidden="true">
                        —
                      </span>
                      <span>{exc}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <aside className="lg:col-span-4 lg:sticky lg:top-28 bg-[#FFFFFF] border border-[#E7E4DA] p-7 space-y-6">
            <div>
              <span className="text-xs uppercase tracking-[0.18em] text-[#244B3A] font-semibold">
                Key Highlights
              </span>
              <h2 className="font-serif text-2xl text-[#102D25] mt-1">Included Elements</h2>
            </div>

            <ul className="divide-y divide-[#E7E4DA] border-y border-[#E7E4DA] text-sm text-[#26342D]">
              {pkg.highlights.map((hl, i) => (
                <li key={i} className="py-3 leading-relaxed">
                  {hl}
                </li>
              ))}
            </ul>

            <GlassButton
              to={`/book?interest=${encodeURIComponent(pkg.name)}`}
              variant="forest"
              className="w-full"
            >
              <span>Request Tailored Proposal</span>
              <ArrowRight className="w-4 h-4 stroke-[1.5]" aria-hidden="true" />
            </GlassButton>
            <p className="text-[11px] text-[#788078] leading-relaxed">
              Confirmed pricing depends on exact travel dates, chosen lodge partner, and seasonal park tariffs.
            </p>
          </aside>
        </div>
      </section>

      <RelatedContent
        eyebrow="More Itineraries"
        title="Alternative Package Frameworks"
        items={related}
      />
    </div>
  );
}
