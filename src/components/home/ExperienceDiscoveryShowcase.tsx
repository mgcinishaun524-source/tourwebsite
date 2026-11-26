import { useCallback, useEffect, useRef } from 'react';
import { ArrowDown, ArrowRight } from 'lucide-react';
import { IMAGE_ASSETS } from '../../config/brand';
import { EXPERIENCES } from '../../data/siteData';
import {
  getLenisInstance,
  gsap,
  ScrollTrigger,
  prefersReducedMotion,
} from '../../motion/gsapConfig';
import { GlassButton } from '../GlassButton';
import { KineticMarqueeStrip } from '../motion/KineticMarqueeStrip';
import DitherHelixCarousel, {
  type DitherHelixItem,
} from '@/components/ui/dither-helix-carousel';

const EXPERIENCE_HELIX_ITEMS: DitherHelixItem[] = [
  ...EXPERIENCES.map((exp) => ({
    title: exp.name,
    category: exp.category,
    image: exp.image,
    href: `/experiences/${exp.slug}`,
  })),
  {
    title: 'Mosi-oa-Tunya Horizon',
    category: 'Waterfall Rim',
    image: IMAGE_ASSETS.heroFalls,
    href: '/destinations/victoria-falls',
  },
  {
    title: 'Riverfront Sanctuary',
    category: 'Hospitality',
    image: IMAGE_ASSETS.luxuryLodge,
    href: '/accommodation',
  },
  {
    title: 'Mist Canopy Trails',
    category: 'Rainforest Reserve',
    image: IMAGE_ASSETS.journalMistCanopy,
    href: '/journal',
  },
];

export function ExperienceDiscoveryShowcase() {
  const stagePinRef = useRef<HTMLDivElement>(null);
  const skipTargetRef = useRef<HTMLDivElement>(null);
  const helixLayerRef = useRef<HTMLDivElement>(null);
  const headerOverlayRef = useRef<HTMLDivElement>(null);
  const portalFrameRef = useRef<HTMLDivElement>(null);
  const portalImgRef = useRef<HTMLDivElement>(null);
  const portalCaptionRef = useRef<HTMLDivElement>(null);
  const forestCurtainRef = useRef<HTMLDivElement>(null);
  const helixProgressRef = useRef(0);
  const helixStRef = useRef<ScrollTrigger | null>(null);

  const reducedMotion = prefersReducedMotion();
  const totalItems = EXPERIENCE_HELIX_ITEMS.length;
  const lastHelixItem = EXPERIENCE_HELIX_ITEMS[totalItems - 1];
  const HELIX_END_PROGRESS = 0.72;

  const handleSelectHelixIndex = useCallback(
    (index: number) => {
      const st = helixStRef.current;
      if (!st) return;
      const ratio = totalItems > 1 ? (index / (totalItems - 1)) * HELIX_END_PROGRESS : 0;
      const targetScroll = st.start + (st.end - st.start) * ratio;

      const lenis = getLenisInstance();
      if (lenis) {
        lenis.scrollTo(targetScroll, { duration: 0.85 });
      } else {
        window.scrollTo({ top: targetScroll, behavior: 'smooth' });
      }
    },
    [totalItems],
  );

  const handleSkipSection = useCallback(() => {
    const st = helixStRef.current;
    const lenis = getLenisInstance();
    const target = skipTargetRef.current
      ? skipTargetRef.current.getBoundingClientRect().top + window.scrollY
      : st
        ? st.end + (stagePinRef.current?.offsetHeight ?? window.innerHeight)
        : window.scrollY + (stagePinRef.current?.offsetHeight ?? window.innerHeight);

    if (lenis) {
      lenis.scrollTo(target, { duration: 1.0 });
    } else {
      window.scrollTo({ top: target, behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    const stagePin = stagePinRef.current;
    if (!stagePin || prefersReducedMotion()) return;

    const mm = gsap.matchMedia();

    mm.add('(min-width: 1024px)', () => {
      const helixLayer = helixLayerRef.current;
      const headerOverlay = headerOverlayRef.current;
      const portalFrame = portalFrameRef.current;
      const portalImg = portalImgRef.current;
      const portalCaption = portalCaptionRef.current;
      const forestCurtain = forestCurtainRef.current;

      if (portalFrame) {
        gsap.set(portalFrame, {
          opacity: 0,
          clipPath: 'inset(18% 24% 18% 24% round 14px)',
        });
      }
      if (portalImg) {
        gsap.set(portalImg, { scale: 1 });
      }
      if (portalCaption) {
        gsap.set(portalCaption, { opacity: 0, y: 18 });
      }
      if (forestCurtain) {
        gsap.set(forestCurtain, {
          clipPath: 'inset(100% 0% 0% 0%)',
        });
      }

      const masterTl = gsap.timeline({
        scrollTrigger: {
          trigger: stagePin,
          start: 'top top',
          end: () => `+=${(totalItems - 1) * 340 + 1350}`,
          pin: true,
          scrub: 0.55,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          refreshPriority: 0,
          onUpdate: (self) => {
            const p = self.progress;
            if (p <= HELIX_END_PROGRESS) {
              helixProgressRef.current = (p / HELIX_END_PROGRESS) * (totalItems - 1);
            } else {
              helixProgressRef.current = totalItems - 1;
            }
          },
        },
      });

      if (masterTl.scrollTrigger) {
        helixStRef.current = masterTl.scrollTrigger;
      }

      // Normalize total duration to 1.00 for deterministic scroll progress choreography
      masterTl.to({}, { duration: 1 }, 0);

      // 0.72 -> 0.76: Reveal focal plate on last helix card while gently clearing overlay chrome
      if (portalFrame) {
        masterTl.to(
          portalFrame,
          {
            opacity: 1,
            ease: 'power2.out',
            duration: 0.04,
          },
          0.72,
        );

        // 0.75 -> 0.89: Seamless full-bleed cinema expansion from centered frame to 100vw/100vh
        masterTl.to(
          portalFrame,
          {
            clipPath: 'inset(0% 0% 0% 0% round 0px)',
            ease: 'power3.inOut',
            duration: 0.14,
          },
          0.75,
        );
      }

      if (helixLayer) {
        masterTl.to(
          helixLayer,
          { opacity: 0, scale: 0.96, ease: 'power2.out', duration: 0.08 },
          0.74,
        );
      }

      if (headerOverlay) {
        masterTl.to(
          headerOverlay,
          { opacity: 0, y: -12, ease: 'power2.out', duration: 0.06 },
          0.73,
        );
      }

      if (portalImg) {
        masterTl.to(
          portalImg,
          { scale: 1.12, ease: 'power1.inOut', duration: 0.22 },
          0.75,
        );
      }

      if (portalCaption) {
        masterTl.to(
          portalCaption,
          { opacity: 1, y: 0, ease: 'power2.out', duration: 0.07 },
          0.81,
        );
        masterTl.to(
          portalCaption,
          { opacity: 0, y: -10, ease: 'power2.in', duration: 0.05 },
          0.91,
        );
      }

      // 0.89 -> 1.00: Deep #102D25 emerald veil rises cleanly to meet Chapter 06 head-on
      if (forestCurtain) {
        masterTl.to(
          forestCurtain,
          {
            clipPath: 'inset(0% 0% 0% 0%)',
            ease: 'power3.inOut',
            duration: 0.11,
          },
          0.89,
        );
      }

      return () => {
        helixStRef.current = null;
        masterTl.kill();
      };
    });

    const rafId = window.requestAnimationFrame(() => {
      ScrollTrigger.refresh();
    });

    return () => {
      window.cancelAnimationFrame(rafId);
      mm.revert();
    };
  }, [totalItems]);

  return (
    <section aria-label="Chapter Five: Find Your Adventure" className="bg-[#FFFFFF] overflow-x-clip">
      <KineticMarqueeStrip
        theme="light"
        phrases={[
          'Chapter 05 · Find Your Adventure',
          'Flight of Angels',
          'Batoka Gorge Rapids',
          'Upper Zambezi Sunset',
          'Mosi-oa-Tunya Rainforest',
        ]}
      />

      {/* Full-Screen Borderless 100vh Experience Helix Stage (Zero Card Container) */}
      <div
        ref={stagePinRef}
        className="relative w-full h-[88vh] lg:h-screen min-h-[600px] lg:min-h-[700px] bg-[#FFFFFF] overflow-hidden"
      >
        {/* Minimal Editorial Overlay Header + Skip Section Action */}
        <div
          ref={headerOverlayRef}
          className="pointer-events-none absolute top-[72px] sm:top-[76px] inset-x-0 z-30 mx-auto max-w-[1440px] px-6 sm:px-10 flex flex-wrap items-start justify-between gap-4 will-change-[opacity,transform]"
        >
          <div className="max-w-md space-y-0.5">
            <span className="block text-[11px] uppercase tracking-[0.22em] text-[#244B3A] font-semibold">
              Chapter 05 · Interactive Experience Discovery
            </span>
            <h2 className="font-logo text-xl sm:text-3xl font-normal text-[#102D25] leading-tight">
              Air, Water &amp; Savannah Perspectives
            </h2>
          </div>

          <div className="pointer-events-auto flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleSkipSection}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#102D25]/20 bg-[#FFFFFF]/82 backdrop-blur-md text-[11px] uppercase tracking-[0.16em] font-semibold text-[#102D25] hover:bg-[#102D25] hover:text-[#F6F4ED] transition-colors cursor-pointer"
            >
              <span>Skip Section</span>
              <ArrowDown className="w-3.5 h-3.5 stroke-[1.75]" aria-hidden="true" />
            </button>

            <GlassButton to="/experiences" variant="ivory" className="px-4 py-2 text-xs">
              <span>All Experiences</span>
              <ArrowRight className="w-3.5 h-3.5 stroke-[1.5]" aria-hidden="true" />
            </GlassButton>
          </div>
        </div>

        {/* Desktop Scroll-Driven Full-Screen WebGL2 Dither Helix */}
        <div ref={helixLayerRef} className="hidden lg:block w-full h-full will-change-[opacity,transform]">
          <DitherHelixCarousel
            items={EXPERIENCE_HELIX_ITEMS}
            accent="#26342D"
            cell={7}
            focusBand={0.44}
            twist={0.72}
            rise={0.88}
            cardRatio={1.62}
            entry={false}
            controlledProgressRef={reducedMotion ? undefined : helixProgressRef}
            onSelectIndex={reducedMotion ? undefined : handleSelectHelixIndex}
            className="h-full w-full bg-[#FFFFFF] text-[#102D25]"
          />
        </div>

        {/* Mobile / Reduced Motion Touch-Interactive Helix */}
        <div className="lg:hidden w-full h-full">
          <DitherHelixCarousel
            items={EXPERIENCE_HELIX_ITEMS}
            accent="#26342D"
            cell={7}
            focusBand={0.44}
            twist={0.72}
            rise={0.88}
            cardRatio={1.5}
            className="h-full w-full bg-[#FFFFFF] text-[#102D25]"
          />
        </div>

        {/* Last-Card Full-Bleed Portal Transition into Chapter 06 Sanctuaries */}
        {!reducedMotion && lastHelixItem && (
          <>
            <div
              ref={portalFrameRef}
              aria-hidden="true"
              className="hidden lg:block pointer-events-none absolute inset-0 z-20 opacity-0 bg-[#102D25] overflow-hidden will-change-[clip-path,opacity]"
            >
              <div ref={portalImgRef} className="w-full h-full will-change-transform">
                <img
                  src={lastHelixItem.image}
                  alt=""
                  draggable={false}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-[#102D25]/88 via-[#102D25]/35 to-[#0D0E0E]/35" />

              <div
                ref={portalCaptionRef}
                className="absolute inset-x-0 bottom-14 mx-auto max-w-2xl px-6 text-center text-[#F6F4ED] will-change-[opacity,transform]"
              >
                <span className="block text-[11px] uppercase tracking-[0.26em] text-[#D9C397] mb-2">
                  Beyond the Canopy · Chapter 06 Next
                </span>
                <p className="font-logo text-4xl xl:text-5xl text-[#FFFFFF] leading-tight tracking-[0.02em]">
                  Into Riverfront Sanctuary
                </p>
              </div>
            </div>

            <div
              ref={forestCurtainRef}
              aria-hidden="true"
              className="hidden lg:block pointer-events-none absolute inset-0 z-30 bg-[#102D25] will-change-[clip-path]"
            />
          </>
        )}
      </div>

      {/* Anchor target cleanly below the pinned helix for Skip Section */}
      <div ref={skipTargetRef} className="sr-only" aria-hidden="true" />
    </section>
  );
}
