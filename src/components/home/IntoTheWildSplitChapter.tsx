import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Compass, Mountain, Sun } from 'lucide-react';
import { IMAGE_ASSETS } from '../../config/brand';
import { PACKAGES } from '../../data/siteData';
import { gsap, MOTION_EASE, prefersReducedMotion } from '../../motion/gsapConfig';
import { GlassButton } from '../GlassButton';
import { ResilientImage } from '../ResilientImage';
import { MaskRevealImage } from '../motion/MaskRevealImage';
import { SplitTextReveal } from '../motion/SplitTextReveal';

const ITINERARY_CARDS = [
  {
    slug: 'thunder-and-wilderness-adventure',
    themeTitle: 'Adventure',
    ctaLabel: 'Choose Adventure',
    description: 'High-energy gorge rapids, helicopter panoramas, and wilderness trails.',
    icon: Mountain,
  },
  {
    slug: 'zambezi-sanctuary-signature',
    themeTitle: 'Relaxation',
    ctaLabel: 'Choose Relaxation',
    description: 'Tranquil riverfront suites, private timber sunset cruises, and unhurried dawn light.',
    icon: Sun,
  },
  {
    slug: 'grand-zambezi-safari-circuit',
    themeTitle: 'Wilderness',
    ctaLabel: 'Choose Wilderness',
    description: 'Deep savannah game tracking paired seamlessly with Mosi-oa-Tunya.',
    icon: Compass,
  },
] as const;

function CornerPalmFrond({ side }: { side: 'left' | 'right' }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 220 180"
      fill="none"
      className={`pointer-events-none select-none hidden sm:block absolute top-0 w-44 lg:w-56 h-auto text-[#244B3A]/20 ${
        side === 'left' ? 'left-0' : 'right-0 -scale-x-100'
      }`}
    >
      <path
        d="M-10,8 C55,22 115,58 176,125"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path d="M18,16 C56,6 92,10 124,26" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M36,24 C84,18 124,26 156,48" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M58,36 C106,36 144,50 176,76" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M82,52 C126,56 160,74 188,104" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M20,18 C12,56 18,98 34,132" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M44,30 C38,72 48,112 70,144" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M72,46 C72,88 86,124 114,154" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M104,68 C108,104 126,136 154,162" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function IntoTheWildSplitChapter() {
  const splitTriggerRef = useRef<HTMLDivElement>(null);
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);
  const rightClipRef = useRef<HTMLDivElement>(null);

  const reducedMotion = prefersReducedMotion();

  useEffect(() => {
    const trigger = splitTriggerRef.current;
    const leftPanel = leftPanelRef.current;
    const rightPanel = rightPanelRef.current;
    const rightClip = rightClipRef.current;
    if (!trigger || !leftPanel || !rightPanel || !rightClip || prefersReducedMotion()) return;

    const mm = gsap.matchMedia();

    mm.add('(max-width: 1023px)', () => {
      gsap.fromTo(
        rightClip,
        { clipPath: 'inset(10% 0% 0% 0%)', opacity: 0 },
        {
          clipPath: 'inset(0% 0% 0% 0%)',
          opacity: 1,
          duration: 0.85,
          ease: MOTION_EASE.cinema,
          scrollTrigger: {
            trigger,
            start: 'top 85%',
            once: true,
          },
        }
      );
    });

    return () => mm.revert();
  }, []);

  return (
    <section
      aria-label="Chapter Four: Into the Wild"
      className="bg-[#FFFFFF] border-b border-[#E7E4DA] overflow-x-clip"
    >
      {/* Split-Screen Hero (Mobile / Reduced-Motion fallback; desktop enters via Chapter 3 diamond breach) */}
      <div
        ref={splitTriggerRef}
        className={`${reducedMotion ? 'block' : 'lg:hidden'} mx-auto max-w-[1380px] px-6 sm:px-10 pt-20 pb-12 lg:pt-28 lg:pb-16`}
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
          <div
            ref={leftPanelRef}
            className="lg:col-span-5 bg-[#18392F] text-[#F6F4ED] p-8 sm:p-10 lg:p-12 flex flex-col justify-between gap-8 will-change-transform"
          >
            <div className="space-y-4">
              <span className="block text-xs uppercase tracking-[0.2em] text-[#D9C397]">
                Chapter 04 · Into the Wild
              </span>
              <SplitTextReveal
                as="h2"
                mode="words"
                text="Sanctuaries Along the River & Savannah"
                className="font-serif text-3xl sm:text-4xl leading-tight text-[#F6F4ED]"
              />
              <p className="text-sm sm:text-base text-[#F6F4ED]/82 leading-relaxed">
                Step from mist-washed gorge cliffs into quiet timber decks above elephant corridors, private boat landings, and wilderness bush camps.
              </p>
            </div>
            <div className="pt-4 border-t border-[#FFFFFF]/12 flex flex-wrap items-center gap-3">
              <GlassButton to="/accommodation" variant="ivory">
                <span>Explore Stays</span>
                <ArrowRight className="w-4 h-4 stroke-[1.5]" aria-hidden="true" />
              </GlassButton>
              <GlassButton to="/packages" variant="gold-outline">
                <span>Travel Packages</span>
              </GlassButton>
            </div>
          </div>

          <div ref={rightPanelRef} className="lg:col-span-7 will-change-transform">
            <div
              ref={rightClipRef}
              className="cinema-clip relative aspect-[16/10] lg:aspect-auto lg:h-full lg:min-h-[440px] overflow-hidden border border-[#E7E4DA]"
            >
              <ResilientImage
                src={IMAGE_ASSETS.safariWildlife}
                alt="Wild elephants moving through golden savannah grass at dusk in Zambezi National Park"
                className="w-full h-full"
              />
              <div className="absolute bottom-5 left-5 right-5 sm:right-auto sm:max-w-sm glass-light px-4 py-3 text-[#102D25]">
                <p className="text-[11px] uppercase tracking-[0.16em] text-[#244B3A] font-semibold">
                  Zambezi National Park
                </p>
                <p className="text-xs text-[#102D25] mt-0.5">
                  Dawn &amp; dusk wildlife corridors minutes from riverfront lodges.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION D COMPOSITIONAL EXPRESSION: Luxury Travel Magazine Wildlife Spread */}
      <div className="mx-auto max-w-[1380px] px-6 sm:px-10 py-16 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
          {/* Left Asymmetric Portrait Plate with Overlapping Detail */}
          <div className="lg:col-span-6 relative pb-10 sm:pb-14">
            <div className="w-[86%] sm:w-[82%] aspect-[4/5] max-h-[540px] overflow-hidden border border-[#E7E4DA] bg-[#121312]">
              <MaskRevealImage
                src={IMAGE_ASSETS.safariWildlife}
                alt="Breeding herd of African elephants crossing Zambezi National Park grasslands"
                variant="curtain"
                className="w-full h-full"
              />
            </div>

            <div className="w-[54%] sm:w-[48%] aspect-[4/3] overflow-hidden border-4 border-[#FFFFFF] bg-[#121312] shadow-[0_24px_48px_-20px_rgba(0,0,0,0.25)] -mt-20 sm:-mt-28 ml-auto relative z-10">
              <ResilientImage
                src={IMAGE_ASSETS.luxuryTransfer}
                alt="Open 4x4 safari cruiser staged at sunrise along riverine track"
                className="w-full h-full"
              />
            </div>

            <p className="mt-3 text-xs font-serif italic text-[#788078] max-w-sm">
              Plate 04 — Morning &amp; dusk wildlife movements across Zambezi National Park’s 56,000-hectare riverine sanctuary.
            </p>
          </div>

          {/* Right Magazine Column & Safari Dispatch Note */}
          <div className="lg:col-span-6 lg:pt-8 space-y-8">
            <div className="space-y-4">
              <span className="block text-xs uppercase tracking-[0.22em] text-[#244B3A] font-semibold">
                Chapter 04 · Magazine Essay · Into the Wild
              </span>
              <h2 className="font-serif text-3xl sm:text-5xl font-normal text-[#102D25] leading-[1.12]">
                Minutes Beyond Town Lies Untamed Savannah
              </h2>
              <p className="text-base text-[#26342D] leading-[1.75] max-w-prose">
                Step off the mist-fed rainforest footpath and within twenty minutes the acoustics shift—waterfall thunder gives way to mopane birdcall, breaking branches, and elephant herds moving steadily toward the Upper Zambezi at dusk.
              </p>
            </div>

            <blockquote className="py-6 border-y border-[#E7E4DA]">
              <p className="font-serif italic text-xl sm:text-2xl text-[#102D25] leading-snug">
                “Transend Tours is not simply somewhere you visit. It’s somewhere you experience—from river dawn to quiet camp lantern.”
              </p>
            </blockquote>

            <div className="grid grid-cols-2 gap-6 text-xs">
              <div>
                <span className="block uppercase tracking-[0.16em] text-[#788078]">
                  Sanctuary Footprint
                </span>
                <span className="block font-logo text-xl text-[#102D25] mt-1 tracking-[0.02em]">
                  56,000 Hectares
                </span>
              </div>
              <div>
                <span className="block uppercase tracking-[0.16em] text-[#788078]">
                  Dry Season Concentration
                </span>
                <span className="block font-logo text-xl text-[#102D25] mt-1 tracking-[0.02em]">
                  May – October
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <GlassButton to="/experiences/zambezi-national-park-private-safari" variant="forest">
                <span>Read Safari Dossier</span>
                <ArrowRight className="w-4 h-4 stroke-[1.5]" aria-hidden="true" />
              </GlassButton>
              <GlassButton to="/destinations/surrounding-safari-areas" variant="ivory">
                <span>Wilderness Areas</span>
              </GlassButton>
            </div>
          </div>
        </div>
      </div>

      {/* Multi-Day Journey Frameworks — Cloned Three-Medallion Portrait Cards Showcase */}
      <div className="relative py-20 lg:py-28 bg-[#FAF8F2] border-t border-[#E7E4DA] overflow-hidden">
        <CornerPalmFrond side="left" />
        <CornerPalmFrond side="right" />

        <div className="relative z-10 mx-auto max-w-[1260px] px-6 sm:px-10 space-y-14">
          {/* Centered Split-Typography Header */}
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <div className="inline-flex items-center justify-center gap-3 text-[11px] uppercase tracking-[0.26em] text-[#244B3A] font-semibold">
              <span className="w-8 sm:w-12 h-px bg-[#244B3A]/45" aria-hidden="true" />
              <span>Multi-Day Journey Frameworks</span>
              <span className="w-8 sm:w-12 h-px bg-[#244B3A]/45" aria-hidden="true" />
            </div>

            <div className="pt-1">
              <h2 className="font-logo text-3xl sm:text-5xl font-normal text-[#102D25] leading-tight">
                Structured Sample
              </h2>
              <p className="font-script text-4xl sm:text-[3.5rem] text-[#244B3A] leading-none mt-0.5">
                Itineraries
              </p>
            </div>

            <p className="text-sm sm:text-[0.95rem] text-[#26342D]/80 leading-relaxed max-w-lg mx-auto pt-1">
              Whether you are seeking high-energy gorge adventure, riverfront relaxation, or deep wilderness safaris, we have the sample journey for you.
            </p>
          </div>

          {/* 3 Rounded Portrait Cards with Top-Center Floating Medallion Icon */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-7 lg:gap-8 pt-6">
            {ITINERARY_CARDS.map((card) => {
              const pkg = PACKAGES.find((p) => p.slug === card.slug) ?? PACKAGES[0];
              const Icon = card.icon;

              return (
                <article key={card.slug} className="group relative pt-7">
                  {/* Top-Center Overlapping Circular Medallion Badge */}
                  <div
                    aria-hidden="true"
                    className="absolute top-0 left-1/2 -translate-x-1/2 z-20 w-14 h-14 rounded-full bg-[#102D25] border-[3px] border-[#FAF8F2] text-[#D9C397] flex items-center justify-center shadow-[0_10px_24px_-6px_rgba(0,0,0,0.35)] transition-transform duration-300 group-hover:scale-105"
                  >
                    <Icon className="w-6 h-6 stroke-[1.6]" />
                  </div>

                  {/* Full-Bleed Rounded Portrait Card */}
                  <Link
                    to={`/packages/${pkg.slug}`}
                    className="relative block h-[430px] sm:h-[465px] rounded-2xl overflow-hidden bg-[#121312] shadow-[0_24px_48px_-18px_rgba(0,0,0,0.28)]"
                  >
                    <ResilientImage
                      src={pkg.image}
                      alt={pkg.imageAlt}
                      className="w-full h-full"
                      imgClassName="w-full h-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.05]"
                    />

                    {/* Subtle Neutral Dark Bottom Scrim Only for Text Legibility (No Green Wash) */}
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-x-0 bottom-0 h-[58%] bg-gradient-to-t from-[#0B0C0C]/92 via-[#0B0C0C]/48 to-transparent"
                    />

                    {/* Centered Lower Content Stack */}
                    <div className="absolute inset-x-0 bottom-0 z-10 p-6 sm:p-7 flex flex-col items-center text-center">
                      <span className="block text-[10px] uppercase tracking-[0.2em] text-[#D9C397] mb-1">
                        {pkg.duration.replace(' (Placeholder)', '')}
                      </span>

                      <h3 className="font-logo text-2xl sm:text-3xl font-normal tracking-wide text-[#FFFFFF] leading-tight">
                        {card.themeTitle}
                      </h3>

                      <p className="mt-2 text-xs sm:text-[13px] text-[#FFFFFF]/88 leading-relaxed max-w-[260px] line-clamp-2">
                        {card.description}
                      </p>

                      <span className="mt-5 inline-flex items-center justify-center gap-2 px-7 py-2.5 rounded-full bg-[#D9C397] group-hover:bg-[#FFFFFF] text-[#102D25] text-xs font-semibold tracking-wide shadow-md transition-all duration-200 group-hover:-translate-y-0.5">
                        <span>{card.ctaLabel}</span>
                        <ArrowRight
                          className="w-3.5 h-3.5 stroke-[2] transition-transform duration-200 group-hover:translate-x-0.5"
                          aria-hidden="true"
                        />
                      </span>
                    </div>
                  </Link>
                </article>
              );
            })}
          </div>

          <div className="text-center pt-2">
            <Link
              to="/packages"
              className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] font-semibold text-[#102D25] hover:text-[#244B3A] border-b border-[#102D25]/35 pb-1 transition-colors"
            >
              <span>Compare All Sample Packages</span>
              <ArrowRight className="w-3.5 h-3.5 stroke-[1.75]" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
