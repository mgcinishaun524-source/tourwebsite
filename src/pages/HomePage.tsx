import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { BRAND_CONFIG, IMAGE_ASSETS } from '../config/brand';
import { JOURNAL_ARTICLES } from '../data/siteData';
import { gsap, MOTION_EASE, prefersReducedMotion } from '../motion/gsapConfig';
import { BookingBar } from '../components/BookingBar';
import { EditorialSectionHeader } from '../components/EditorialSectionHeader';
import { GlassButton } from '../components/GlassButton';
import { ImageGallery } from '../components/ImageGallery';
import { ResilientImage } from '../components/ResilientImage';
import { TestimonialSection } from '../components/TestimonialSection';
import { WhatsAppButton } from '../components/WhatsAppButton';
import { GreatFallsChapter } from '../components/home/GreatFallsChapter';
import { ZambeziHorizontalChapter } from '../components/home/ZambeziHorizontalChapter';
import { IntoTheWildSplitChapter } from '../components/home/IntoTheWildSplitChapter';
import { ExperienceDiscoveryShowcase } from '../components/home/ExperienceDiscoveryShowcase';
import { AccommodationLookbook } from '../components/home/AccommodationLookbook';
import { SplitTextReveal } from '../components/motion/SplitTextReveal';

const HERO_SLIDES = [
  {
    id: 'transend-tours',
    eyebrow: BRAND_CONFIG.tagline.toUpperCase(),
    title: 'Transend Tours',
    shortLabel: 'Transend Tours',
    useLogoFont: true,
    titleClass: 'font-logo text-[13.5vw] sm:text-[12vw] lg:text-[10.4vw] leading-[0.96] tracking-[0.02em]',
    caption:
      'Transend Tours is not simply somewhere you visit. It’s somewhere you experience — curated from Mosi-oa-Tunya.',
    image: IMAGE_ASSETS.heroFalls,
    alt: 'Transend Tours golden hour vista with rising mist over the Zambezi gorge',
    ctaLabel: 'Explore Experiences',
    ctaTo: '/experiences',
  },
  {
    id: 'africa',
    eyebrow: 'ZAMBEZI NATIONAL PARK · WILDLIFE CORRIDOR',
    title: 'Africa',
    shortLabel: 'Africa',
    useLogoFont: true,
    titleClass: 'font-logo text-[15.5vw] sm:text-[13.5vw] lg:text-[11.2vw] leading-[0.96] tracking-[0.02em]',
    caption:
      'Dawn and dusk elephant herds moving silently across golden savannah grasslands.',
    image: IMAGE_ASSETS.safariWildlife,
    alt: 'Herd of wild African elephants walking across golden savannah grass at dusk',
    ctaLabel: 'Explore Safaris',
    ctaTo: '/experiences?category=Safari+Adventures',
  },
  {
    id: 'zambezi',
    eyebrow: 'UPPER & LOWER BASIN · ZIMBABWE',
    title: 'Zambezi',
    shortLabel: 'Zambezi',
    useLogoFont: true,
    titleClass: 'font-logo text-[15.5vw] sm:text-[13.5vw] lg:text-[11.2vw] leading-[0.96] tracking-[0.02em]',
    caption:
      'Glass-calm timber voyages above the cataracts and basalt rapids inside Batoka Gorge.',
    image: IMAGE_ASSETS.zambeziCruise,
    alt: 'Timber riverboat cruising Upper Zambezi channels at sunset',
    ctaLabel: 'Explore Destinations',
    ctaTo: '/destinations',
  },
] as const;

const FEATURED_GALLERY = [
  {
    src: IMAGE_ASSETS.heroFalls,
    alt: 'Golden-hour panorama of Transend Tours mist plume and gorge',
    caption: 'Mosi-oa-Tunya — First light rising above the rainforest rim.',
  },
  {
    src: IMAGE_ASSETS.helicopterFlight,
    alt: 'Helicopter flight soaring above Transend Tours rainbow mist',
    caption: 'Flight of Angels — Aerial sweep above the Batoka Gorge.',
  },
  {
    src: IMAGE_ASSETS.zambeziCruise,
    alt: 'Timber riverboat cruising Upper Zambezi at sunset',
    caption: 'Upper Zambezi — Tranquil river channels above the cataracts.',
  },
  {
    src: IMAGE_ASSETS.safariWildlife,
    alt: 'Elephants crossing golden savannah grass in Zambezi National Park',
    caption: 'Zambezi National Park — Breeding herds at dusk.',
  },
  {
    src: IMAGE_ASSETS.luxuryLodge,
    alt: 'Luxury timber lodge terrace overlooking the Zambezi River at twilight',
    caption: 'Riverfront Sanctuary — Twilight hospitality along the water.',
  },
];

export function HomePage() {
  const heroBgRef = useRef<HTMLDivElement>(null);
  const heroSectionRef = useRef<HTMLElement>(null);
  const heroContentRef = useRef<HTMLDivElement>(null);
  const heroTitleGroupRef = useRef<HTMLDivElement>(null);
  const closingTakeoverRef = useRef<HTMLDivElement>(null);
  const closingBgRef = useRef<HTMLDivElement>(null);

  const [heroSlideIdx, setHeroSlideIdx] = useState(0);

  const featuredJournal = JOURNAL_ARTICLES.slice(0, 3);
  const activeSlide = HERO_SLIDES[heroSlideIdx];
  const nextSlide = HERO_SLIDES[(heroSlideIdx + 1) % HERO_SLIDES.length];

  const handleSlideChange = (nextIdx: number) => {
    setHeroSlideIdx(nextIdx);
    if (!prefersReducedMotion() && heroTitleGroupRef.current) {
      gsap.fromTo(
        heroTitleGroupRef.current,
        { y: 18, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.65, ease: MOTION_EASE.cinema, clearProps: 'transform' }
      );
    }
  };

  useEffect(() => {
    if (prefersReducedMotion()) return;

    const mm = gsap.matchMedia();

    mm.add(
      {
        isDesktop: '(min-width: 1024px)',
        isMobile: '(max-width: 1023px)',
      },
      (context) => {
        const isDesktop = context.conditions?.isDesktop ?? true;

        // Chapter 1: Hero entrance + scroll scale-out parallax
        if (heroBgRef.current && heroSectionRef.current) {
          gsap.fromTo(
            heroBgRef.current,
            { scale: 1.1 },
            { scale: 1, duration: 1.35, ease: MOTION_EASE.cinema }
          );

          if (isDesktop) {
            gsap.to(heroBgRef.current, {
              yPercent: 14,
              scale: 1.08,
              ease: 'none',
              scrollTrigger: {
                trigger: heroSectionRef.current,
                start: 'top top',
                end: 'bottom top',
                scrub: true,
              },
            });
          }
        }

        if (heroContentRef.current) {
          const items = heroContentRef.current.querySelectorAll<HTMLElement>('[data-hero-stagger]');
          gsap.fromTo(
            items,
            { y: 18, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.75,
              stagger: 0.08,
              delay: 0.15,
              ease: MOTION_EASE.cinema,
              clearProps: 'transform',
            }
          );
        }

        // Section G: Closing Full-Bleed Lodge Takeover
        if (closingTakeoverRef.current && closingBgRef.current) {
          gsap.fromTo(
            closingTakeoverRef.current,
            {
              clipPath: isDesktop
                ? 'inset(10% 6% 4% 6%)'
                : 'inset(6% 3% 0% 3%)',
            },
            {
              clipPath: 'inset(0% 0% 0% 0%)',
              ease: isDesktop ? 'none' : MOTION_EASE.cinema,
              duration: isDesktop ? 1 : 0.9,
              scrollTrigger: isDesktop
                ? {
                    trigger: closingTakeoverRef.current,
                    start: 'top 90%',
                    end: 'top 25%',
                    scrub: 0.9,
                  }
                : {
                    trigger: closingTakeoverRef.current,
                    start: 'top 85%',
                    once: true,
                  },
            }
          );

          gsap.fromTo(
            closingBgRef.current,
            { scale: isDesktop ? 1.15 : 1.06 },
            {
              scale: 1,
              ease: isDesktop ? 'none' : MOTION_EASE.cinema,
              duration: isDesktop ? 1 : 1.1,
              scrollTrigger: isDesktop
                ? {
                    trigger: closingTakeoverRef.current,
                    start: 'top 92%',
                    end: 'bottom top',
                    scrub: 0.9,
                  }
                : {
                    trigger: closingTakeoverRef.current,
                    start: 'top 85%',
                    once: true,
                  },
            }
          );
        }
      }
    );

    return () => mm.revert();
  }, []);

  return (
    <div>
      {/* SECTION A — THE ARRIVAL */}
      <section
        ref={heroSectionRef}
        aria-label="Chapter One: Arrival at Transend Tours"
        className="relative h-screen min-h-[680px] flex flex-col justify-between pt-28 sm:pt-32 pb-8 sm:pb-12 bg-[#0D0E0E] text-[#FFFFFF] overflow-hidden"
      >
        <div className="absolute inset-0 overflow-hidden">
          <div ref={heroBgRef} className="relative w-full h-full will-change-transform">
            {HERO_SLIDES.map((slide, idx) => (
              <div
                key={slide.id}
                className={`absolute inset-0 transition-opacity duration-700 ease-out ${
                  idx === heroSlideIdx ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
              >
                {idx === heroSlideIdx && (
                  <ResilientImage
                    src={slide.image}
                    alt={slide.alt}
                    className="w-full h-full"
                    priority
                  />
                )}
              </div>
            ))}
          </div>
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-b from-[#000000]/38 via-transparent to-[#000000]/48"
          />
        </div>

        <div
          ref={heroContentRef}
          className="relative z-20 mx-auto w-full max-w-[1440px] px-6 sm:px-10 flex-1 flex flex-col justify-between"
        >
          <div
            ref={heroTitleGroupRef}
            className="flex-1 flex flex-col items-center justify-center text-center select-none pb-6"
          >
            <span
              data-hero-stagger
              className="block text-[11px] sm:text-xs md:text-sm uppercase tracking-[0.34em] sm:tracking-[0.44em] text-[#FFFFFF]/95 font-medium mb-2 sm:mb-3 drop-shadow-[0_2px_10px_rgba(0,0,0,0.65)]"
            >
              {activeSlide.eyebrow}
            </span>

            <h1
              data-hero-stagger
              className={`text-[#FFFFFF] drop-shadow-[0_18px_48px_rgba(0,0,0,0.45)] ${activeSlide.titleClass}`}
            >
              {activeSlide.title}
            </h1>
          </div>

          <div
            data-hero-stagger
            className="grid grid-cols-1 md:grid-cols-3 items-center gap-6 md:gap-4"
          >
            <p className="text-xs sm:text-[13px] text-[#FFFFFF]/88 leading-relaxed max-w-xs mx-auto md:mx-0 text-center md:text-left">
              {activeSlide.caption}
            </p>

            <div className="flex justify-center">
              <Link
                to={activeSlide.ctaTo}
                className="inline-flex items-center justify-center px-9 py-3.5 border border-[#FFFFFF]/80 bg-[#000000]/22 backdrop-blur-xs text-[11px] uppercase tracking-[0.22em] font-semibold text-[#FFFFFF] hover:bg-[#FFFFFF] hover:text-[#102D25] transition-colors duration-300"
              >
                {activeSlide.ctaLabel}
              </Link>
            </div>

            <div className="flex items-center justify-center md:justify-end gap-4 sm:gap-5 text-[11px] uppercase tracking-[0.2em]">
              <button
                type="button"
                onClick={() =>
                  handleSlideChange(
                    (heroSlideIdx - 1 + HERO_SLIDES.length) % HERO_SLIDES.length
                  )
                }
                aria-label="Previous destination highlight"
                className="p-1 text-[#FFFFFF]/85 hover:text-[#FFFFFF] transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5 stroke-[1.75]" aria-hidden="true" />
              </button>

              <span className="whitespace-nowrap font-logo text-base sm:text-lg text-[#FFFFFF] leading-none normal-case tracking-[0.02em]">
                {activeSlide.shortLabel}
              </span>

              <button
                type="button"
                onClick={() => handleSlideChange((heroSlideIdx + 1) % HERO_SLIDES.length)}
                className="text-[#FFFFFF]/65 hover:text-[#FFFFFF] transition-colors whitespace-nowrap cursor-pointer font-logo text-base sm:text-lg leading-none normal-case tracking-[0.02em]"
              >
                {nextSlide.shortLabel}
              </button>

              <button
                type="button"
                onClick={() => handleSlideChange((heroSlideIdx + 1) % HERO_SLIDES.length)}
                aria-label="Next destination highlight"
                className="p-1 text-[#FFFFFF]/85 hover:text-[#FFFFFF] transition-colors cursor-pointer"
              >
                <ArrowRight className="w-3.5 h-3.5 stroke-[1.75]" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Architectural Enquiry Bar */}
      <div className="bg-[#F6F4ED] border-b border-[#E7E4DA] py-8 lg:py-10">
        <div className="mx-auto max-w-[1380px] px-6 sm:px-10 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[#788078] px-1">
            <span className="uppercase tracking-[0.18em] text-[#244B3A] font-medium">
              Direct Itinerary Brief
            </span>
            <span>{BRAND_CONFIG.location.coordinatesLabel} · Transend Tours, Zimbabwe</span>
          </div>
          <BookingBar variant="section" />
        </div>
      </div>

      {/* SECTION B — THE GREAT FALLS (Zoom-Through Rainforest Portal) */}
      <GreatFallsChapter />

      {/* SECTION C — FOLLOW THE ZAMBEZI (Horizontal River Corridor + Breach into Wild) */}
      <ZambeziHorizontalChapter />

      {/* SECTION D — INTO THE WILD (Luxury Magazine Spread + Package Itinerary Dossier) */}
      <IntoTheWildSplitChapter />

      {/* SECTION E — FIND YOUR ADVENTURE (Interactive Experience Stage) */}
      <ExperienceDiscoveryShowcase />

      {/* SECTION F — ACCOMMODATION (Architectural Sanctuary Lookbook) */}
      <AccommodationLookbook />

      {/* MONOGRAPH PHOTOGRAPHY EXHIBITION */}
      <section aria-label="Visual Monograph" className="py-20 lg:py-24 bg-[#FFFFFF] border-b border-[#E7E4DA]">
        <div className="mx-auto max-w-[1380px] px-6 sm:px-10 space-y-12">
          <EditorialSectionHeader
            variant="broadsheet"
            eyebrow="Visual Monograph"
            title="Light, Mist & River Horizon"
            subtitle="Open any numbered plate to inspect high-resolution photography across Transend Tours, Batoka Gorge, and the Upper Zambezi."
          />
          <ImageGallery images={FEATURED_GALLERY} columns={3} />
        </div>
      </section>

      {/* SECTION G — YOUR JOURNEY STARTS HERE (Correspondence Reader + Broadsheet Dispatches + Closing Takeover) */}
      <div aria-label="Chapter Seven: Your Journey Starts Here">
        <TestimonialSection />

        {/* Horizontal Periodical Dispatches (Eliminates repetitive 1+2 card grids) */}
        <section className="py-20 lg:py-28 bg-[#FFFFFF] border-t border-[#E7E4DA]">
          <div className="mx-auto max-w-[1380px] px-6 sm:px-10 space-y-12">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
              <EditorialSectionHeader
                eyebrow="Field Notes & Essays"
                title="From the Transend Tours Journal"
                subtitle="Seasonal water guides, planning considerations, and cultural perspectives written for thoughtful travellers."
              />
              <GlassButton to="/journal" variant="ivory">
                <span>Read All Dispatches</span>
                <ArrowRight className="w-4 h-4 stroke-[1.5]" aria-hidden="true" />
              </GlassButton>
            </div>

            <div className="divide-y divide-[#E7E4DA] border-y border-[#E7E4DA]">
              {featuredJournal.map((article, idx) => (
                <article
                  key={article.slug}
                  className="group py-8 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center"
                >
                  <div className="lg:col-span-1 text-xs uppercase tracking-[0.18em] text-[#788078] tabular-nums">
                    No. 0{idx + 1}
                  </div>

                  <Link
                    to={`/journal/${article.slug}`}
                    className="lg:col-span-4 block aspect-[16/10] overflow-hidden border border-[#E7E4DA] bg-[#102D25]"
                  >
                    <ResilientImage
                      src={article.image}
                      alt={article.imageAlt}
                      className="w-full h-full"
                      imgClassName="w-full h-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03]"
                    />
                  </Link>

                  <div className="lg:col-span-5 space-y-2.5">
                    <div className="flex items-center gap-2 text-xs text-[#788078]">
                      <span className="uppercase tracking-[0.16em] text-[#244B3A] font-semibold">
                        {article.category}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{article.readTimePlaceholder}</span>
                    </div>
                    <h3 className="font-serif text-2xl sm:text-[1.7rem] text-[#102D25] leading-snug">
                      <Link
                        to={`/journal/${article.slug}`}
                        className="hover:text-[#244B3A] transition-colors"
                      >
                        {article.title}
                      </Link>
                    </h3>
                    <p className="text-sm text-[#788078] leading-relaxed line-clamp-2">
                      {article.excerpt}
                    </p>
                  </div>

                  <div className="lg:col-span-2 flex lg:justify-end">
                    <Link
                      to={`/journal/${article.slug}`}
                      className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] font-semibold text-[#102D25] group-hover:text-[#244B3A] whitespace-nowrap"
                    >
                      <span>Read Essay</span>
                      <ArrowRight
                        className="w-3.5 h-3.5 stroke-[1.5] transition-transform duration-200 group-hover:translate-x-1"
                        aria-hidden="true"
                      />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Closing Full-Bleed Image Takeover */}
        <section className="bg-[#FFFFFF]">
          <div
            ref={closingTakeoverRef}
            className="cinema-clip relative py-28 lg:py-40 bg-[#0E0F0F] text-[#F6F4ED] overflow-hidden"
          >
            <div className="absolute inset-0 overflow-hidden">
              <div ref={closingBgRef} className="w-full h-full will-change-transform">
                <ResilientImage
                  src={IMAGE_ASSETS.luxuryLodge}
                  alt="Luxury Transend Tours riverside lodge terrace illuminated at twilight"
                  className="w-full h-full"
                />
              </div>
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-t from-[#000000]/42 via-transparent to-transparent"
              />
            </div>

            <div className="relative z-10 mx-auto max-w-[1100px] px-6 sm:px-10">
              <div className="glass-forest p-8 sm:p-12 lg:p-14 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                <div className="max-w-xl space-y-4">
                  <span className="block text-xs uppercase tracking-[0.22em] text-[#D9C397]">
                    Section 07 · Your Journey Starts Here
                  </span>
                  <SplitTextReveal
                    as="h2"
                    mode="words"
                    text="Transend Tours awaits when you are ready."
                    className="font-serif text-3xl sm:text-4xl lg:text-[2.75rem] font-normal leading-tight text-[#F6F4ED]"
                  />
                  <p className="text-sm sm:text-base text-[#F6F4ED]/85 leading-relaxed">
                    Submit a structured ten-step travel brief or begin a conversation directly with our planning desk.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3 shrink-0">
                  <GlassButton to="/book" variant="ivory">
                    <span>Plan Your Trip</span>
                    <ArrowRight className="w-4 h-4 stroke-[1.5]" aria-hidden="true" />
                  </GlassButton>
                  <WhatsAppButton variant="glass" />
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
