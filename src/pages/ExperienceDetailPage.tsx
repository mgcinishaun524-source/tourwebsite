import { useParams } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { EXPERIENCES } from '../data/siteData';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { EditorialSectionHeader } from '../components/EditorialSectionHeader';
import { EmptyState } from '../components/EmptyState';
import { GlassButton } from '../components/GlassButton';
import { ImageGallery } from '../components/ImageGallery';
import { RelatedContent } from '../components/RelatedContent';
import { WhatsAppButton } from '../components/WhatsAppButton';
import { CinematicHeroMedia } from '../components/motion/CinematicHeroMedia';
import { SplitTextReveal } from '../components/motion/SplitTextReveal';

export function ExperienceDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const experience = EXPERIENCES.find((item) => item.slug === slug);

  if (!experience) {
    return (
      <div className="pt-36 pb-24 px-6 bg-[#F6F4ED] min-h-[70vh]">
        <EmptyState
          title="Experience Not Found"
          description="The requested Transend Tours experience could not be located. Return to our curated catalogue to browse available excursions."
          actionLabel="View All Experiences"
          actionTo="/experiences"
        />
      </div>
    );
  }

  const related = EXPERIENCES.filter((e) => e.slug !== experience.slug)
    .slice(0, 3)
    .map((e) => ({
      slug: e.slug,
      title: e.name,
      kicker: e.category,
      summary: e.shortDescription,
      image: e.image,
      imageAlt: e.imageAlt,
      to: `/experiences/${e.slug}`,
    }));

  return (
    <div>
      {/* Viewport-Commanding Immersive Photograph Cover */}
      <section className="relative min-h-[74vh] flex flex-col justify-end pt-36 pb-14 lg:pb-18 bg-[#0E0F0F] text-[#F6F4ED] overflow-hidden">
        <CinematicHeroMedia
          src={experience.image}
          alt={experience.imageAlt}
          scrimClassName="bg-gradient-to-t from-[#0B0C0C]/76 via-[#0B0C0C]/20 to-transparent"
        />

        <div className="relative z-10 mx-auto w-full max-w-[1380px] px-6 sm:px-10 space-y-8">
          <div className="space-y-4 max-w-4xl">
            <Breadcrumbs
              theme="dark"
              items={[
                { label: 'Experiences', to: '/experiences' },
                { label: experience.name },
              ]}
            />
            <SplitTextReveal
              as="h1"
              mode="words"
              trigger="mount"
              text={experience.name}
              className="font-serif text-4xl sm:text-6xl lg:text-[4.25rem] font-normal leading-[1.06]"
            />
            <p className="text-base sm:text-lg text-[#F6F4ED]/85 leading-relaxed max-w-2xl">
              {experience.shortDescription}
            </p>
          </div>

          {/* Architectural Quick Spec Ribbon */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-[#FFFFFF]/18 text-xs">
            <div>
              <span className="block uppercase tracking-[0.18em] text-[#D9C397] mb-1">
                Category
              </span>
              <span className="text-sm text-[#F6F4ED]">{experience.category}</span>
            </div>
            <div>
              <span className="block uppercase tracking-[0.18em] text-[#D9C397] mb-1">
                Setting
              </span>
              <span className="text-sm text-[#F6F4ED]">{experience.locationLabel}</span>
            </div>
            <div>
              <span className="block uppercase tracking-[0.18em] text-[#D9C397] mb-1">
                Seasonality
              </span>
              <span className="text-sm text-[#F6F4ED]">{experience.seasonalityPlaceholder}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content + Specification Ledger */}
      <section className="py-16 lg:py-24 bg-[#F6F4ED]">
        <div className="mx-auto max-w-[1380px] px-6 sm:px-10 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          <div className="lg:col-span-7 space-y-12">
            <div className="space-y-4">
              <EditorialSectionHeader eyebrow="Overview" title="The Experience" />
              <p className="text-base sm:text-[1.05rem] text-[#26342D] leading-[1.8] max-w-prose">
                {experience.overview}
              </p>
            </div>

            <div className="space-y-5 pt-8 border-t border-[#E7E4DA]">
              <h2 className="font-serif text-2xl sm:text-3xl text-[#102D25]">
                Experience Highlights
              </h2>
              <ul className="divide-y divide-[#E7E4DA] border-y border-[#E7E4DA]">
                {experience.highlights.map((item, idx) => (
                  <li key={idx} className="py-4 flex items-start gap-4 text-sm sm:text-base text-[#26342D] leading-relaxed">
                    <span className="font-serif text-lg text-[#244B3A] tabular-nums shrink-0" aria-hidden="true">
                      0{idx + 1}
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-4 pt-4">
              <h2 className="font-serif text-2xl sm:text-3xl text-[#102D25]">What to Expect</h2>
              <ul className="space-y-3">
                {experience.whatToExpect.map((step, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm sm:text-base text-[#788078] leading-relaxed">
                    <span className="text-[#244B3A]" aria-hidden="true">
                      —
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-8 border-t border-[#E7E4DA] space-y-2">
              <span className="block text-xs uppercase tracking-[0.18em] text-[#244B3A] font-semibold">
                Requirements &amp; Confirmation Notice
              </span>
              <p className="text-sm text-[#788078] leading-relaxed max-w-prose">
                {experience.requirementsNote}
              </p>
            </div>
          </div>

          {/* Crisp Hairline Architectural Dossier Sidebar */}
          <aside className="lg:col-span-5 lg:sticky lg:top-28 bg-[#FFFFFF] border border-[#E7E4DA] p-7 sm:p-9 space-y-6">
            <div>
              <span className="text-xs uppercase tracking-[0.2em] text-[#244B3A] font-semibold">
                Practical Information
              </span>
              <h2 className="font-serif text-2xl text-[#102D25] mt-1">
                Duration &amp; Logistics
              </h2>
            </div>

            <dl className="divide-y divide-[#E7E4DA] border-y border-[#E7E4DA] text-sm">
              <div className="py-3.5 flex flex-col gap-1">
                <dt className="text-xs uppercase tracking-[0.12em] text-[#788078]">
                  Duration Guidance
                </dt>
                <dd className="text-[#102D25] font-medium">
                  {experience.durationPlaceholder}
                </dd>
              </div>
              {experience.practicalInfo.map((row) => (
                <div key={row.label} className="py-3.5 flex flex-col gap-1">
                  <dt className="text-xs uppercase tracking-[0.12em] text-[#788078]">
                    {row.label}
                  </dt>
                  <dd className="text-[#102D25] font-medium">{row.value}</dd>
                </div>
              ))}
            </dl>

            <div className="space-y-3 pt-2">
              <GlassButton
                to="/checkout"
                variant="forest"
                className="w-full"
              >
                <span>Check Live Availability &amp; Book</span>
                <ArrowRight className="w-4 h-4 stroke-[1.5]" aria-hidden="true" />
              </GlassButton>
              <GlassButton
                to={`/book?interest=${encodeURIComponent(experience.name)}`}
                variant="ivory"
                className="w-full"
              >
                <span>Enquire About This Experience</span>
                <ArrowRight className="w-4 h-4 stroke-[1.5]" aria-hidden="true" />
              </GlassButton>
              <WhatsAppButton
                variant="outline"
                className="w-full"
                message={`Hello, I would like to enquire about ${experience.name}.`}
              />
            </div>
            <p className="text-[11px] text-[#788078] leading-relaxed">
              Submitting an enquiry checks seasonal availability and confirmed operator rates; no instant reservation is charged here.
            </p>
          </aside>
        </div>
      </section>

      {experience.gallery.length > 0 && (
        <section className="py-16 lg:py-20 bg-[#FFFFFF] border-t border-[#E7E4DA]">
          <div className="mx-auto max-w-[1380px] px-6 sm:px-10">
            <EditorialSectionHeader
              eyebrow="Gallery"
              title="Visual Perspectives"
              className="mb-10"
            />
            <ImageGallery images={experience.gallery} columns={2} />
          </div>
        </section>
      )}

      <RelatedContent
        eyebrow="Related Experiences"
        title="Pair With Another Journey"
        items={related}
      />
    </div>
  );
}
