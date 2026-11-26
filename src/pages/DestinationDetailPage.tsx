import { Link, useParams } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { DESTINATIONS, EXPERIENCES } from '../data/siteData';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { EditorialSectionHeader } from '../components/EditorialSectionHeader';
import { EmptyState } from '../components/EmptyState';
import { GlassButton } from '../components/GlassButton';
import { ResilientImage } from '../components/ResilientImage';
import { CinematicHeroMedia } from '../components/motion/CinematicHeroMedia';
import { SplitTextReveal } from '../components/motion/SplitTextReveal';

export function DestinationDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const destination = DESTINATIONS.find((d) => d.slug === slug);

  if (!destination) {
    return (
      <div className="pt-36 pb-24 px-6 bg-[#F6F4ED] min-h-[70vh]">
        <EmptyState
          title="Destination Not Found"
          description="The requested destination guide could not be located."
          actionLabel="Explore Destinations"
          actionTo="/destinations"
        />
      </div>
    );
  }

  const relatedExperiences = EXPERIENCES.filter((exp) =>
    destination.relatedExperienceSlugs.includes(exp.slug)
  );

  return (
    <div>
      {/* Atmospheric Edge-to-Edge Geographic Cover */}
      <section className="relative min-h-[68vh] flex flex-col justify-end pt-36 pb-14 lg:pb-18 bg-[#0E0F0F] text-[#F6F4ED] overflow-hidden">
        <CinematicHeroMedia
          src={destination.image}
          alt={destination.imageAlt}
          scrimClassName="bg-gradient-to-t from-[#0B0C0C]/76 via-[#0B0C0C]/20 to-transparent"
        />

        <div className="relative z-10 mx-auto w-full max-w-[1380px] px-6 sm:px-10 space-y-6">
          <Breadcrumbs
            theme="dark"
            items={[
              { label: 'Destinations', to: '/destinations' },
              { label: destination.name },
            ]}
          />
          <div className="max-w-3xl space-y-4">
            <span className="block text-xs uppercase tracking-[0.22em] text-[#D9C397]">
              {destination.regionTag}
            </span>
            <SplitTextReveal
              as="h1"
              mode="words"
              trigger="mount"
              text={destination.name}
              className="font-serif text-4xl sm:text-6xl font-normal leading-[1.08]"
            />
            <p className="text-base sm:text-lg text-[#F6F4ED]/85 leading-relaxed max-w-2xl">
              {destination.shortIntro}
            </p>
          </div>
        </div>
      </section>

      {/* Regional Essay + Clean Planning Ledger */}
      <section className="py-16 lg:py-24 bg-[#F6F4ED]">
        <div className="mx-auto max-w-[1380px] px-6 sm:px-10 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          <div className="lg:col-span-7 space-y-12">
            <div className="space-y-4">
              <EditorialSectionHeader eyebrow="Geography" title="Sense of Place" />
              <p className="text-base sm:text-[1.05rem] text-[#26342D] leading-[1.85] max-w-prose">
                {destination.overview}
              </p>
            </div>

            <div className="space-y-5 pt-8 border-t border-[#E7E4DA]">
              <h2 className="font-serif text-2xl sm:text-3xl text-[#102D25]">
                Things to Experience
              </h2>
              <ul className="divide-y divide-[#E7E4DA] border-y border-[#E7E4DA]">
                {destination.thingsToExperience.map((item, idx) => (
                  <li
                    key={idx}
                    className="py-4 flex items-start gap-4 text-sm sm:text-base text-[#26342D]"
                  >
                    <span className="font-serif text-lg text-[#244B3A] tabular-nums shrink-0" aria-hidden="true">
                      0{idx + 1}.
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <aside className="lg:col-span-5 lg:sticky lg:top-28 bg-[#FFFFFF] border border-[#E7E4DA] p-7 sm:p-9 space-y-6">
            <div>
              <span className="text-xs uppercase tracking-[0.18em] text-[#244B3A] font-semibold">
                Destination Notes
              </span>
              <h2 className="font-serif text-2xl text-[#102D25] mt-1">
                Planning Considerations
              </h2>
            </div>

            <dl className="divide-y divide-[#E7E4DA] border-y border-[#E7E4DA] text-sm">
              <div className="py-3.5 space-y-1">
                <dt className="text-xs uppercase tracking-[0.12em] text-[#788078]">
                  Seasonal Window
                </dt>
                <dd className="text-[#102D25] font-medium">
                  {destination.bestTimePlaceholder}
                </dd>
              </div>
              <div className="py-3.5 space-y-1">
                <dt className="text-xs uppercase tracking-[0.12em] text-[#788078]">
                  Operational Status Note
                </dt>
                <dd className="text-[#26342D] leading-relaxed">
                  {destination.operationalNote}
                </dd>
              </div>
            </dl>

            <GlassButton
              to={`/book?destination=${encodeURIComponent(destination.slug)}`}
              variant="forest"
              className="w-full"
            >
              <span>Enquire About {destination.name}</span>
              <ArrowRight className="w-4 h-4 stroke-[1.5]" aria-hidden="true" />
            </GlassButton>
          </aside>
        </div>
      </section>

      {/* Related Local Experiences Horizontal Rows */}
      {relatedExperiences.length > 0 && (
        <section className="py-16 lg:py-24 bg-[#FFFFFF] border-t border-[#E7E4DA]">
          <div className="mx-auto max-w-[1380px] px-6 sm:px-10 space-y-10">
            <EditorialSectionHeader
              variant="broadsheet"
              eyebrow="Related Activities"
              title={`Experiences in ${destination.name}`}
            />
            <div className="divide-y divide-[#E7E4DA] border-b border-[#E7E4DA]">
              {relatedExperiences.map((exp, idx) => (
                <article
                  key={exp.slug}
                  className="group py-7 grid grid-cols-1 md:grid-cols-12 gap-6 items-center"
                >
                  <div className="md:col-span-1 text-xs text-[#788078] tabular-nums">
                    0{idx + 1}
                  </div>
                  <Link
                    to={`/experiences/${exp.slug}`}
                    className="md:col-span-3 block aspect-[16/10] overflow-hidden border border-[#E7E4DA] bg-[#102D25]"
                  >
                    <ResilientImage
                      src={exp.image}
                      alt={exp.imageAlt}
                      className="w-full h-full"
                      imgClassName="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                    />
                  </Link>
                  <div className="md:col-span-6 space-y-1.5">
                    <span className="block text-[11px] uppercase tracking-[0.16em] text-[#244B3A] font-medium">
                      {exp.category} · {exp.durationPlaceholder}
                    </span>
                    <h3 className="font-serif text-2xl text-[#102D25]">
                      <Link
                        to={`/experiences/${exp.slug}`}
                        className="hover:text-[#244B3A] transition-colors"
                      >
                        {exp.name}
                      </Link>
                    </h3>
                    <p className="text-sm text-[#788078] line-clamp-2">{exp.shortDescription}</p>
                  </div>
                  <div className="md:col-span-2 flex md:justify-end">
                    <Link
                      to={`/experiences/${exp.slug}`}
                      className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] font-semibold text-[#102D25]"
                    >
                      <span>View</span>
                      <ArrowRight className="w-3.5 h-3.5 stroke-[1.5]" aria-hidden="true" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
