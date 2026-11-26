import { useCallback, useEffect, useRef } from 'react';
import { ArrowRight } from 'lucide-react';
import { IMAGE_ASSETS } from '../../config/brand';
import {
  getLenisInstance,
  gsap,
  ScrollTrigger,
  prefersReducedMotion,
} from '../../motion/gsapConfig';
import { GlassButton } from '../GlassButton';
import { ResilientImage } from '../ResilientImage';
import {
  WorksWheel,
  computeWorksWheelCardSize,
  type WorksWheelItem,
} from '@/components/ui/works-wheel';

interface ZambeziWheelLandmark extends WorksWheelItem {
  alt?: string;
}

const ZAMBEZI_WHEEL_ITEMS: ZambeziWheelLandmark[] = [
  {
    title: 'Transend Tours',
    image: IMAGE_ASSETS.heroFalls,
    href: '/destinations/victoria-falls',
  },
  {
    title: 'Upper Zambezi',
    image: IMAGE_ASSETS.zambeziCruise,
    href: '/destinations/zambezi-river',
  },
  {
    title: 'Livingstone Rim',
    image: IMAGE_ASSETS.livingstoneIsland,
    href: '/destinations/livingstone-and-island-rim',
  },
  {
    title: 'Batoka Gorge',
    image: IMAGE_ASSETS.whiteWaterRafting,
    href: '/experiences/batoka-gorge-white-water-rafting',
  },
  {
    title: 'Rainforest Canopy',
    image: IMAGE_ASSETS.rainforestWalk,
    href: '/experiences/guided-rainforest-falls-walk',
  },
  {
    title: 'Flight of Angels',
    image: IMAGE_ASSETS.helicopterFlight,
    href: '/experiences/helicopter-flight-over-victoria-falls',
  },
  {
    title: 'Zambezi Safaris',
    image: IMAGE_ASSETS.safariWildlife,
    href: '/destinations/surrounding-safari-areas',
  },
  {
    title: 'River Sanctuaries',
    image: IMAGE_ASSETS.luxuryLodge,
    href: '/accommodation',
  },
];

// Single unified timeline split:
// 0.00 -> 0.58 : Ring bloom + full 3D wheel rotation ending squarely on the last card ("River Sanctuaries")
// 0.58 -> 1.00 : Seamless full-viewport expansion + zoom + skewed diamond breach directly from River Sanctuaries into Chapter 04
const WHEEL_END_PROGRESS = 0.58;
const RING_OPEN_PROGRESS = 0.06;

export function ZambeziHorizontalChapter() {
  const wrapperRef = useRef<HTMLElement>(null);
  const wheelPinRef = useRef<HTMLDivElement>(null);
  const headerOverlayRef = useRef<HTMLDivElement>(null);
  const wheelLayerRef = useRef<HTMLDivElement>(null);
  const wheelTurnRef = useRef(0);
  const wheelStRef = useRef<ScrollTrigger | null>(null);

  // Seamless Portal Refs operating directly on the last card image ("River Sanctuaries")
  const portalCardRef = useRef<HTMLDivElement>(null);
  const portalImgRef = useRef<HTMLDivElement>(null);
  const portalSurgeRef = useRef<HTMLDivElement>(null);

  // Nested Chapter 04 Split-Screen Refs (Emerging through skewed diamond breach)
  const chapter4BreachRef = useRef<HTMLDivElement>(null);
  const ch4LeftRef = useRef<HTMLDivElement>(null);
  const ch4RightRef = useRef<HTMLDivElement>(null);
  const ch4RightClipRef = useRef<HTMLDivElement>(null);
  const ch4RightImgRef = useRef<HTMLDivElement>(null);

  const reducedMotion = prefersReducedMotion();
  const totalStops = ZAMBEZI_WHEEL_ITEMS.length;
  const lastWheelItem = ZAMBEZI_WHEEL_ITEMS[totalStops - 1];

  const handleSelectWheelIndex = useCallback(
    (index: number) => {
      const st = wheelStRef.current;
      if (!st) return;
      const ratio = totalStops > 1 ? index / (totalStops - 1) : 0;
      const targetProgress = RING_OPEN_PROGRESS + ratio * (WHEEL_END_PROGRESS - RING_OPEN_PROGRESS);
      const targetScroll = st.start + (st.end - st.start) * targetProgress;

      const lenis = getLenisInstance();
      if (lenis) {
        lenis.scrollTo(targetScroll, { duration: 0.9 });
      } else {
        window.scrollTo({ top: targetScroll, behavior: 'smooth' });
      }
    },
    [totalStops],
  );

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const wheelPin = wheelPinRef.current;
    const headerOverlay = headerOverlayRef.current;
    const wheelLayer = wheelLayerRef.current;
    const portalCard = portalCardRef.current;
    const portalImg = portalImgRef.current;
    const portalSurge = portalSurgeRef.current;
    const chapter4Breach = chapter4BreachRef.current;
    const ch4Left = ch4LeftRef.current;
    const ch4Right = ch4RightRef.current;
    const ch4RightClip = ch4RightClipRef.current;
    const ch4RightImg = ch4RightImgRef.current;

    if (!wrapper || !wheelPin || prefersReducedMotion()) {
      return;
    }

    const mm = gsap.matchMedia();

    mm.add('(min-width: 1024px)', () => {
      const getCardBox = () =>
        computeWorksWheelCardSize(
          wheelPin.clientWidth || window.innerWidth,
          wheelPin.clientHeight || window.innerHeight,
        );

      const getStageBox = () => ({
        w: wheelPin.clientWidth || window.innerWidth,
        h: wheelPin.clientHeight || window.innerHeight,
      });

      if (headerOverlay) {
        gsap.set(headerOverlay, { opacity: 1 });
      }
      if (wheelLayer) {
        gsap.set(wheelLayer, { opacity: 1 });
      }
      if (portalCard) {
        const { cardW, cardH } = getCardBox();
        gsap.set(portalCard, {
          opacity: 0,
          width: cardW,
          height: cardH,
          top: '53%',
          left: '50%',
          xPercent: -50,
          yPercent: -50,
          borderRadius: '12px',
          borderColor: 'rgba(255,255,255,0.2)',
        });
      }
      if (portalImg) {
        gsap.set(portalImg, { scale: 1, transformOrigin: '50% 50%' });
      }
      if (portalSurge) {
        gsap.set(portalSurge, { opacity: 0 });
      }
      if (chapter4Breach) {
        gsap.set(chapter4Breach, {
          pointerEvents: 'none',
          clipPath: 'polygon(50% 50%, 50% 50%, 50% 50%, 50% 50%)',
        });
      }
      if (ch4Left) {
        gsap.set(ch4Left, { x: -64, y: 84, scale: 0.88, opacity: 0 });
      }
      if (ch4Right) {
        gsap.set(ch4Right, { x: 64, y: -84, scale: 1.14, opacity: 0 });
      }
      if (ch4RightClip) {
        gsap.set(ch4RightClip, {
          clipPath: 'polygon(16% 0%, 100% 0%, 84% 100%, 0% 100%)',
        });
      }
      if (ch4RightImg) {
        gsap.set(ch4RightImg, { scale: 1.2 });
      }

      const masterTl = gsap.timeline({
        scrollTrigger: {
          trigger: wheelPin,
          start: 'top top',
          end: () => `+=${totalStops * 380 + 1950}`,
          pin: true,
          scrub: 0.55,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          refreshPriority: 1,
          onUpdate: (self) => {
            const p = self.progress;
            if (p <= RING_OPEN_PROGRESS) {
              wheelTurnRef.current = (p / RING_OPEN_PROGRESS) * 1;
            } else if (p <= WHEEL_END_PROGRESS) {
              wheelTurnRef.current =
                1 +
                ((p - RING_OPEN_PROGRESS) / (WHEEL_END_PROGRESS - RING_OPEN_PROGRESS)) *
                  (totalStops - 1);
            } else {
              // Hold cleanly on the final card ("River Sanctuaries") while it expands full-screen
              wheelTurnRef.current = totalStops;
            }
          },
        },
      });

      if (masterTl.scrollTrigger) {
        wheelStRef.current = masterTl.scrollTrigger;
      }

      // Normalize timeline duration to 1.00 so phase timestamps align 1:1 with ScrollTrigger progress
      masterTl.to({}, { duration: 1 }, 0);

      // 0.60 -> 0.625: Hand off pixel-for-pixel from the centered River Sanctuaries wheel card to the expandable portal frame
      if (portalCard) {
        masterTl.fromTo(
          portalCard,
          {
            opacity: 0,
            width: () => getCardBox().cardW,
            height: () => getCardBox().cardH,
            top: '53%',
            borderRadius: '12px',
            borderColor: 'rgba(255,255,255,0.2)',
          },
          {
            opacity: 1,
            width: () => getCardBox().cardW,
            height: () => getCardBox().cardH,
            top: '53%',
            borderRadius: '12px',
            borderColor: 'rgba(255,255,255,0.2)',
            ease: 'none',
            duration: 0.025,
          },
          0.60,
        );

        // 0.625 -> 0.75: Expand River Sanctuaries from its wheel frame out to full viewport
        masterTl.to(
          portalCard,
          {
            width: () => getStageBox().w,
            height: () => getStageBox().h,
            top: '50%',
            borderRadius: '0px',
            borderColor: 'rgba(255,255,255,0)',
            ease: 'power3.inOut',
            duration: 0.135,
          },
          0.625,
        );
      }

      // 0.62 -> 0.68: Dissolve wheel surroundings, header, and side index cleanly
      if (wheelLayer) {
        masterTl.to(
          wheelLayer,
          { opacity: 0, ease: 'power2.out', duration: 0.06 },
          0.62,
        );
      }
      if (headerOverlay) {
        masterTl.to(
          headerOverlay,
          { opacity: 0, y: -12, ease: 'power2.out', duration: 0.055 },
          0.62,
        );
      }

      // 0.65 -> 0.88: Cinematic optical dive + champagne horizon glow on the River Sanctuaries frame
      if (portalImg) {
        masterTl.to(
          portalImg,
          {
            scale: 2.25,
            ease: 'power2.in',
            duration: 0.23,
          },
          0.65,
        );
      }
      if (portalSurge) {
        masterTl.to(
          portalSurge,
          { opacity: 0.78, ease: 'power2.in', duration: 0.14 },
          0.72,
        );
      }

      // 0.79 -> 0.96: Skewed diamond aperture breach into Chapter 04 directly out of River Sanctuaries
      if (chapter4Breach) {
        masterTl.to(
          chapter4Breach,
          {
            clipPath: 'polygon(24% 0%, 100% 22%, 76% 100%, 0% 78%)',
            ease: 'power2.in',
            duration: 0.08,
          },
          0.79,
        );
        masterTl.set(chapter4Breach, { pointerEvents: 'auto' }, 0.87);
        masterTl.to(
          chapter4Breach,
          {
            clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
            ease: 'power3.out',
            duration: 0.095,
          },
          0.87,
        );
      }

      if (ch4Left) {
        masterTl.to(
          ch4Left,
          {
            x: 0,
            y: 0,
            scale: 1,
            opacity: 1,
            ease: 'power3.out',
            duration: 0.12,
          },
          0.83,
        );
      }
      if (ch4Right) {
        masterTl.to(
          ch4Right,
          {
            x: 0,
            y: 0,
            scale: 1,
            opacity: 1,
            ease: 'power3.out',
            duration: 0.12,
          },
          0.83,
        );
      }
      if (ch4RightClip) {
        masterTl.to(
          ch4RightClip,
          {
            clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
            ease: 'power3.out',
            duration: 0.12,
          },
          0.85,
        );
      }
      if (ch4RightImg) {
        masterTl.to(
          ch4RightImg,
          {
            scale: 1,
            ease: 'power2.out',
            duration: 0.13,
          },
          0.84,
        );
      }

      return () => {
        wheelStRef.current = null;
        masterTl.scrollTrigger?.kill();
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
  }, [totalStops]);

  return (
    <section
      ref={wrapperRef}
      aria-label="Chapter Three: Follow the Zambezi"
      className="relative bg-[#102D25] text-[#F6F4ED] overflow-x-clip"
    >
      {/* Unified Full-Screen 100vh Stage: WorksWheel -> Direct Expansion & Chapter 04 Breach on "River Sanctuaries" */}
      <div
        ref={wheelPinRef}
        className="relative w-full h-[85vh] lg:h-screen min-h-[600px] lg:min-h-[700px] overflow-hidden"
      >
        {/* Subtle Overlaid Header (Positioned clear of the enlarged 3D drum cards) */}
        <div
          ref={headerOverlayRef}
          className="pointer-events-none absolute top-[72px] sm:top-[76px] inset-x-0 z-30 mx-auto max-w-[1440px] px-6 sm:px-10 flex items-start justify-between gap-4 will-change-[opacity,transform]"
        >
          <div className="max-w-md space-y-0.5">
            <span className="block text-[11px] uppercase tracking-[0.22em] text-[#D9C397] font-medium">
              Chapter 03 · Follow the Zambezi
            </span>
            <h2 className="font-serif text-xl sm:text-3xl font-normal text-[#F6F4ED] leading-tight">
              The Zambezi Corridor
            </h2>
          </div>

          <div className="pointer-events-auto shrink-0">
            <GlassButton to="/destinations" variant="gold-outline" className="px-4 py-2 text-xs">
              <span>All Destinations</span>
              <ArrowRight className="w-3.5 h-3.5 stroke-[1.5]" aria-hidden="true" />
            </GlassButton>
          </div>
        </div>

        {/* Full-Bleed Edge-to-Edge 3D WorksWheel (Desktop Scroll-Driven) */}
        <div ref={wheelLayerRef} className="hidden lg:block w-full h-full will-change-[opacity]">
          <WorksWheel
            items={ZAMBEZI_WHEEL_ITEMS}
            label="The Zambezi"
            action="Explore"
            controlledTurnRef={reducedMotion ? undefined : wheelTurnRef}
            onSelectIndex={reducedMotion ? undefined : handleSelectWheelIndex}
            className="bg-[#102D25] text-[#F6F4ED] [--background:#102D25] [--foreground:#F6F4ED] [--muted:#18392F] [--muted-foreground:rgba(246,244,237,0.58)]"
          />
        </div>

        {/* Standalone Touch/Drag/Index WorksWheel for Mobile & Reduced Motion */}
        <div className="lg:hidden w-full h-full">
          <WorksWheel
            items={ZAMBEZI_WHEEL_ITEMS}
            label="The Zambezi"
            action="Explore"
            className="bg-[#102D25] text-[#F6F4ED] [--background:#102D25] [--foreground:#F6F4ED] [--muted:#18392F] [--muted-foreground:rgba(246,244,237,0.58)]"
          />
        </div>

        {/* Seamless Portal Layer Directly on Last Wheel Image ("River Sanctuaries") */}
        {!reducedMotion && lastWheelItem && (
          <>
            <div
              ref={portalCardRef}
              aria-hidden="true"
              className="hidden lg:block pointer-events-none absolute z-20 overflow-hidden border border-[#FFFFFF]/20 shadow-[0_24px_60px_-18px_rgba(0,0,0,0.65)] opacity-0 will-change-transform"
            >
              <div ref={portalImgRef} className="w-full h-full will-change-transform">
                <img
                  src={lastWheelItem.image}
                  alt=""
                  draggable={false}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
              <div
                ref={portalSurgeRef}
                className="pointer-events-none absolute inset-0 opacity-0 bg-[radial-gradient(circle_at_50%_48%,rgba(217,195,151,0.45)_0%,rgba(14,15,15,0.38)_52%,rgba(10,11,11,0.78)_100%)]"
              />
            </div>

            {/* Chapter 04 (Into the Wild) Skewed Diamond Breach Directly Inside River Sanctuaries */}
            <div
              ref={chapter4BreachRef}
              className="hidden lg:flex cinema-clip pointer-events-none absolute inset-0 z-30 bg-[#FFFFFF] items-center pt-24 pb-10 overflow-hidden"
            >
              <div className="mx-auto w-full max-w-[1380px] px-10">
                <div className="grid grid-cols-12 gap-8 items-stretch">
                  <div
                    ref={ch4LeftRef}
                    className="col-span-5 bg-[#18392F] text-[#F6F4ED] rounded-2xl p-10 xl:p-12 flex flex-col justify-between gap-8 shadow-[0_24px_48px_-24px_rgba(0,0,0,0.4)] will-change-transform"
                  >
                    <div className="space-y-4">
                      <span className="block text-xs uppercase tracking-[0.2em] text-[#D9C397]">
                        Chapter 04 · Into the Wild
                      </span>
                      <h2 className="font-serif text-3xl xl:text-4xl leading-tight text-[#F6F4ED]">
                        Sanctuaries Along the River &amp; Savannah
                      </h2>
                      <p className="text-base text-[#F6F4ED]/82 leading-relaxed">
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

                  <div ref={ch4RightRef} className="col-span-7 will-change-transform">
                    <div
                      ref={ch4RightClipRef}
                      className="cinema-clip relative h-full min-h-[440px] max-h-[540px] rounded-2xl overflow-hidden border border-[#E7E4DA] shadow-[0_24px_48px_-24px_rgba(0,0,0,0.22)]"
                    >
                      <div ref={ch4RightImgRef} className="w-full h-full will-change-transform">
                        <ResilientImage
                          src={IMAGE_ASSETS.safariWildlife}
                          alt="Wild elephants moving through golden savannah grass at dusk in Zambezi National Park"
                          className="w-full h-full"
                        />
                      </div>
                      <div className="absolute bottom-5 left-5 max-w-sm glass-light rounded-xl px-4 py-3 text-[#102D25]">
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
            </div>
          </>
        )}
      </div>
    </section>
  );
}
