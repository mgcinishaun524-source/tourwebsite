import { ArrowRight } from 'lucide-react';
import { BRAND_CONFIG, IMAGE_ASSETS } from '../config/brand';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { EditorialSectionHeader } from '../components/EditorialSectionHeader';
import { GlassButton } from '../components/GlassButton';
import { Reveal } from '../components/Reveal';
import { MaskRevealImage } from '../components/motion/MaskRevealImage';
import { SplitTextReveal } from '../components/motion/SplitTextReveal';

const VALUES = [
  {
    index: '01',
    title: 'Editorial Restraint & Honesty',
    description:
      'We communicate clearly about seasonal river conditions, park access, and confirmed operator credentials without exaggerated claims.',
  },
  {
    index: '02',
    title: 'Hospitality Grounded in Place',
    description:
      'Every journey is curated from Transend Tours outward—respecting local rhythms, quiet natural hours, and authentic Zimbabwean warmth.',
  },
  {
    index: '03',
    title: 'Seamless Coordination',
    description:
      'From private airport arrivals to cross-border excursions and safari extensions, logistics are structured around calm guest comfort.',
  },
  {
    index: '04',
    title: 'Responsible Stewardship',
    description:
      'We aim to work alongside conservation-conscious lodges and community partners whose practices respect wildlife corridors and local livelihoods.',
  },
];

export function AboutPage() {
  return (
    <div>
      {/* Light Ivory Broadsheet Masthead (Distinct editorial monograph opening) */}
      <section className="pt-36 pb-16 lg:pt-44 lg:pb-24 bg-[#F6F4ED] text-[#102D25] border-b border-[#E7E4DA]">
        <div className="mx-auto max-w-[1380px] px-6 sm:px-10 space-y-12">
          <div className="space-y-6">
            <Breadcrumbs theme="light" items={[{ label: 'About Us' }]} />
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-end">
              <div className="lg:col-span-8 space-y-4">
                <span className="block text-xs uppercase tracking-[0.24em] text-[#244B3A] font-semibold">
                  Monograph · Philosophy &amp; Stewardship
                </span>
                <SplitTextReveal
                  as="h1"
                  mode="words"
                  trigger="mount"
                  text="Transend Tours is not simply somewhere you visit. It’s somewhere you experience."
                  className="font-serif text-4xl sm:text-5xl lg:text-[3.8rem] font-normal leading-[1.08] text-[#102D25]"
                />
              </div>
              <div className="lg:col-span-4 pb-1 border-t border-[#E7E4DA] pt-4 lg:border-t-0 lg:pt-0">
                <p className="text-sm text-[#788078] leading-relaxed">
                  {BRAND_CONFIG.temporaryBrandNotice}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
            <div className="lg:col-span-9 aspect-[21/10] overflow-hidden border border-[#E7E4DA] bg-[#102D25]">
              <MaskRevealImage
                src={IMAGE_ASSETS.rainforestWalk}
                alt="Sunbeams filtering through lush Transend Tours rainforest canopy"
                variant="curtain"
                priority
                className="w-full h-full"
              />
            </div>
            <div className="lg:col-span-3 space-y-2 pt-3 border-t border-[#102D25]/25">
              <span className="block text-[11px] uppercase tracking-[0.18em] text-[#244B3A] font-semibold">
                Coordinates
              </span>
              <p className="font-serif italic text-lg text-[#102D25]">
                {BRAND_CONFIG.location.city}, {BRAND_CONFIG.location.country}
              </p>
              <p className="text-xs text-[#788078] tabular-nums">
                {BRAND_CONFIG.location.coordinatesLabel}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Company Story Monograph */}
      <section className="py-20 lg:py-28 bg-[#FFFFFF] border-b border-[#E7E4DA]">
        <div className="mx-auto max-w-[1380px] px-6 sm:px-10">
          <Reveal className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-5">
              <div className="aspect-[4/5] max-h-[520px] overflow-hidden border border-[#E7E4DA] bg-[#102D25]">
                <MaskRevealImage
                  src={IMAGE_ASSETS.luxuryLodge}
                  alt="Riverfront lodge veranda overlooking the Upper Zambezi"
                  variant="iris"
                  className="w-full h-full"
                />
              </div>
            </div>

            <div className="lg:col-span-7 space-y-8 lg:pl-6">
              <EditorialSectionHeader
                eyebrow="Company Story"
                title="Built Around Authentic Destination Knowledge"
              />
              <div className="space-y-5 text-base sm:text-[1.05rem] text-[#26342D] leading-[1.85] max-w-prose">
                <p className="first-letter:text-5xl first-letter:font-serif first-letter:text-[#102D25] first-letter:float-left first-letter:mr-3 first-letter:mt-1">
                  [Company Founding Story Placeholder] — Established to serve travellers seeking considered, personal access to Transend Tours and the Zambezi basin, our team focuses on crafting tailored itineraries rather than standardised group tours.
                </p>
                <p className="text-[#788078]">
                  [Verified History &amp; Leadership Bio Placeholder] — Final founding year, registered trading entity name, and leadership biographies will be inserted here once supplied by the client. No unverified corporate milestones or external awards are published prior to verification.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Mission & Vision Hairline Diptych */}
      <section className="py-20 lg:py-24 bg-[#F6F4ED] border-b border-[#E7E4DA]">
        <div className="mx-auto max-w-[1380px] px-6 sm:px-10 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#E7E4DA] border-y border-[#E7E4DA]">
          <div className="py-10 md:pr-12 space-y-4">
            <span className="block text-xs uppercase tracking-[0.2em] text-[#244B3A] font-semibold">
              01 · Our Mission
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-normal text-[#102D25] leading-snug">
              Thoughtful journeys rooted in local integrity.
            </h2>
            <p className="text-sm sm:text-base text-[#788078] leading-relaxed max-w-lg">
              [Mission Statement Placeholder] — To design memorable, logistically effortless travel experiences with Transend Tours and surrounding safari territories through transparent communication, bespoke curation, and genuine hospitality.
            </p>
          </div>

          <div className="py-10 md:pl-12 space-y-4">
            <span className="block text-xs uppercase tracking-[0.2em] text-[#244B3A] font-semibold">
              02 · Our Vision
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-normal text-[#102D25] leading-snug">
              A trusted benchmark for Zimbabwean luxury travel.
            </h2>
            <p className="text-sm sm:text-base text-[#788078] leading-relaxed max-w-lg">
              [Vision Statement Placeholder] — To represent Transend Tours on the international stage with refined editorial standards, meaningful community engagement, and lasting respect for the natural heritage of Southern Africa.
            </p>
          </div>
        </div>
      </section>

      {/* Values Ledger & Responsible Stewardship */}
      <section className="py-20 lg:py-28 bg-[#FFFFFF]">
        <div className="mx-auto max-w-[1380px] px-6 sm:px-10 space-y-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            <div className="lg:col-span-5 lg:sticky lg:top-28">
              <EditorialSectionHeader
                eyebrow="Our Values"
                title="Principles Guiding Every Itinerary"
                subtitle="Every recommendation is measured against seasonal honesty, guest calm, and local respect."
              />
            </div>
            <div className="lg:col-span-7 divide-y divide-[#E7E4DA] border-y border-[#E7E4DA]">
              {VALUES.map((val) => (
                <div key={val.index} className="py-7 grid grid-cols-1 sm:grid-cols-12 gap-4">
                  <span className="sm:col-span-2 font-serif text-2xl text-[#244B3A] tabular-nums">
                    {val.index}.
                  </span>
                  <div className="sm:col-span-10 space-y-2">
                    <h3 className="font-serif text-2xl text-[#102D25]">{val.title}</h3>
                    <p className="text-sm text-[#788078] leading-relaxed">{val.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#102D25] text-[#F6F4ED] p-8 sm:p-12 lg:p-16 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 space-y-4">
              <span className="block text-xs uppercase tracking-[0.22em] text-[#D9C397]">
                Responsible &amp; Sustainable Tourism
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl font-normal leading-snug">
                Respecting Wildlife Corridors &amp; Host Communities
              </h2>
              <p className="text-sm sm:text-base text-[#F6F4ED]/80 leading-relaxed max-w-2xl">
                Transend Tours operates within a sensitive transboundary ecosystem. Our approach favours low-impact excursions, respectful small-group cultural visits, and transparent partnerships—with formal conservation partner names and any future sustainability accreditations listed only once verified by the client.
              </p>
            </div>
            <div className="lg:col-span-4 flex lg:justify-end">
              <GlassButton to="/book" variant="ivory">
                <span>Plan Your Journey</span>
                <ArrowRight className="w-4 h-4 stroke-[1.5]" aria-hidden="true" />
              </GlassButton>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
