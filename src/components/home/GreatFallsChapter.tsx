import { useEffect, useRef } from 'react';
import { ArrowRight } from 'lucide-react';
import { IMAGE_ASSETS } from '../../config/brand';
import { gsap, MOTION_EASE, ScrollTrigger, prefersReducedMotion } from '../../motion/gsapConfig';
import { EditorialSectionHeader } from '../EditorialSectionHeader';
import { GlassButton } from '../GlassButton';
import { ResilientImage } from '../ResilientImage';
import { SplitTextReveal } from '../motion/SplitTextReveal';

export function GreatFallsChapter() {
  const sectionRef = useRef<HTMLElement>(null);
  const headlineTrackRef = useRef<HTMLDivElement>(null);
  const portalStageRef = useRef<HTMLDivElement>(null);
  const takeoverRef = useRef<HTMLDivElement>(null);
  const takeoverImgRef = useRef<HTMLDivElement>(null);
  const rainforestCardRef = useRef<HTMLDivElement>(null);
  const mistGlowRef = useRef<HTMLDivElement>(null);
  const innerSectionRef = useRef<HTMLDivElement>(null);
  const innerContentRef = useRef<HTMLDivElement>(null);
  const innerInsetPhotoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const headlineTrack = headlineTrackRef.current;
    const portalStage = portalStageRef.current;
    const takeover = takeoverRef.current;
    const takeoverImg = takeoverImgRef.current;
    const rainforestCard = rainforestCardRef.current;
    const mistGlow = mistGlowRef.current;
    const innerSection = innerSectionRef.current;
    const innerContent = innerContentRef.current;
    const innerInsetPhoto = innerInsetPhotoRef.current;

    if (!section || !portalStage || !takeover || !takeoverImg || !innerSection || !innerContent) {
      return;
    }

    if (prefersReducedMotion()) {
      gsap.set(innerSection, { clearProps: 'clipPath,opacity,transform' });
      gsap.set(innerContent, { clearProps: 'opacity,transform' });
      return;
    }

    const mm = gsap.matchMedia();

    mm.add(
      {
        isDesktop: '(min-width: 1024px)',
        isMobile: '(max-width: 1023px)',
      },
      (context) => {
        const isDesktop = context.conditions?.isDesktop ?? true;

        if (isDesktop && headlineTrack) {
          gsap.fromTo(
            headlineTrack,
            { xPercent: -5 },
            {
              xPercent: 6,
              ease: 'none',
              scrollTrigger: {
                trigger: section,
                start: 'top bottom',
                end: 'top top',
                scrub: 0.9,
              },
            }
          );
        }

        if (isDesktop) {
          gsap.set(takeover, {
            clipPath: 'inset(5% 3.5% 5% 3.5% round 0px)',
          });
          gsap.set(takeoverImg, {
            scale: 1,
            transformOrigin: '50% 52%',
          });
          gsap.set(innerSection, {
            clipPath: 'circle(0% at 50% 52%)',
          });
          gsap.set(innerContent, {
            scale: 0.78,
            opacity: 0,
            transformOrigin: '50% 50%',
          });
          if (innerInsetPhoto) {
            gsap.set(innerInsetPhoto, { scale: 1.12 });
          }

          const approachTl = gsap.timeline({
            scrollTrigger: {
              trigger: portalStage,
              start: 'top 90%',
              end: 'top top',
              scrub: 0.75,
              invalidateOnRefresh: true,
              refreshPriority: 3,
            },
          });

          approachTl
            .to(
              takeover,
              {
                clipPath: 'inset(0% 0% 0% 0% round 0px)',
                ease: 'none',
                duration: 1,
              },
              0
            )
            .to(
              takeoverImg,
              {
                scale: 1.18,
                ease: 'none',
                duration: 1,
              },
              0
            );

          const portalTl = gsap.timeline({
            scrollTrigger: {
              trigger: portalStage,
              start: 'top top',
              end: '+=1650',
              pin: true,
              scrub: 0.75,
              anticipatePin: 1,
              invalidateOnRefresh: true,
              refreshPriority: 2,
            },
          });

          portalTl.fromTo(
            takeoverImg,
            { scale: 1.18 },
            {
              scale: 2.8,
              ease: 'power1.inOut',
              duration: 0.92,
            },
            0
          );

          if (rainforestCard) {
            portalTl.to(
              rainforestCard,
              {
                y: -44,
                scale: 1.06,
                opacity: 0,
                ease: 'power2.in',
                duration: 0.28,
              },
              0.06
            );
          }

          if (mistGlow) {
            portalTl.fromTo(
              mistGlow,
              { opacity: 0 },
              {
                opacity: 0.65,
                ease: 'power1.in',
                duration: 0.3,
              },
              0.16
            );
          }

          portalTl.to(
            innerSection,
            {
              clipPath: 'circle(92% at 50% 52%)',
              ease: 'power2.inOut',
              duration: 0.54,
            },
            0.34
          );

          portalTl.to(
            innerContent,
            {
              scale: 1,
              opacity: 1,
              ease: 'power2.out',
              duration: 0.48,
            },
            0.4
          );

          if (innerInsetPhoto) {
            portalTl.to(
              innerInsetPhoto,
              {
                scale: 1,
                ease: 'power2.out',
                duration: 0.5,
              },
              0.42
            );
          }

          portalTl.to({}, { duration: 0.08 }, 0.92);
        } else {
          gsap.set(innerSection, { clearProps: 'clipPath' });
          gsap.set(innerContent, { clearProps: 'scale,opacity,transform' });

          gsap.fromTo(
            takeover,
            { clipPath: 'inset(6% 0% 6% 0%)' },
            {
              clipPath: 'inset(0% 0% 0% 0%)',
              duration: 0.9,
              ease: MOTION_EASE.cinema,
              scrollTrigger: {
                trigger: takeover,
                start: 'top 84%',
                once: true,
              },
            }
          );

          gsap.fromTo(
            takeoverImg,
            { scale: 1.12 },
            {
              scale: 1,
              duration: 1.1,
              ease: MOTION_EASE.cinema,
              scrollTrigger: {
                trigger: takeover,
                start: 'top 84%',
                once: true,
              },
            }
          );

          gsap.fromTo(
            innerContent,
            { opacity: 0, y: 24 },
            {
              opacity: 1,
              y: 0,
              duration: 0.85,
              ease: MOTION_EASE.cinema,
              clearProps: 'transform',
              scrollTrigger: {
                trigger: innerSection,
                start: 'top 85%',
                once: true,
              },
            }
          );
        }
      }
    );

    const rafId = window.requestAnimationFrame(() => {
      ScrollTrigger.refresh();
    });

    return () => {
      window.cancelAnimationFrame(rafId);
      mm.revert();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      aria-label="Chapter Two: The Great Falls"
      className="pt-20 lg:pt-28 bg-[#F6F4ED] border-b border-[#E7E4DA] overflow-x-clip"
    >
      {/* Asymmetric Dramatic Typography Lead */}
      <div className="mx-auto max-w-[1380px] px-6 sm:px-10 pb-10 lg:pb-14">
        <div className="border-b border-[#E7E4DA] pb-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-end overflow-x-clip">
          <div className="lg:col-span-4 space-y-2">
            <span className="block text-xs uppercase tracking-[0.22em] text-[#244B3A] font-semibold">
              Chapter 02 · The Great Falls
            </span>
            <p className="text-xs text-[#788078] max-w-xs leading-relaxed">
              1,708 metres across · 108 metres deep · Rising spray visible thirty kilometres away.
            </p>
          </div>
          <div
            ref={headlineTrackRef}
            className="lg:col-span-8 lg:text-right will-change-transform"
          >
            <h2 className="font-logo text-3xl sm:text-5xl lg:text-[4rem] leading-[1.06] text-[#102D25] tracking-[0.02em]">
              Mosi-oa-Tunya — The Smoke That Thunders
            </h2>
          </div>
        </div>
      </div>

      {/* Desktop Pinned Zoom-Through Portal Stage (Cleanly stacks on mobile/reduced motion) */}
      <div
        ref={portalStageRef}
        className="relative lg:h-screen lg:min-h-[680px] lg:overflow-hidden"
      >
        {/* LAYER A: Rainforest Rim — Expands & Continues Zooming Deep Into the Mist */}
        <div className="px-6 sm:px-10 lg:px-0 lg:absolute lg:inset-0">
          <div
            ref={takeoverRef}
            className="cinema-clip relative aspect-[16/10] lg:aspect-auto lg:w-full lg:h-full overflow-hidden border border-[#E7E4DA] lg:border-0 bg-[#121312]"
          >
            <div ref={takeoverImgRef} className="w-full h-full will-change-transform">
              <ResilientImage
                src={IMAGE_ASSETS.rainforestWalk}
                alt="Sunbeams slanting through lush Transend Tours rainforest path"
                className="w-full h-full"
              />
            </div>

            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-t from-[#000000]/38 via-transparent to-transparent"
            />

            <div
              ref={mistGlowRef}
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 opacity-0 bg-[radial-gradient(circle_at_50%_52%,rgba(246,244,237,0.88)_0%,rgba(246,244,237,0.35)_28%,transparent_64%)]"
            />

            <div
              ref={rainforestCardRef}
              className="absolute bottom-5 left-5 right-5 sm:bottom-8 sm:left-8 lg:bottom-14 lg:left-14 sm:right-auto max-w-lg glass-forest p-6 sm:p-8 text-[#F6F4ED] will-change-transform"
            >
              <span className="block text-[11px] uppercase tracking-[0.22em] text-[#D9C397] mb-2">
                Rainforest Rim · Zimbabwe
              </span>
              <SplitTextReveal
                as="h2"
                mode="words"
                text="Where River Mist Meets Measured Hospitality"
                className="font-serif text-2xl sm:text-3xl leading-snug text-[#F6F4ED]"
              />
            </div>
          </div>
        </div>

        {/* LAYER B: Nested Editorial Philosophy Emerging From Inside the Forest Center */}
        <div
          ref={innerSectionRef}
          className="cinema-clip relative lg:absolute lg:inset-0 lg:z-20 bg-[#F6F4ED] flex items-center py-16 sm:py-20 lg:py-0 lg:pt-24 lg:pb-10"
        >
          <div
            ref={innerContentRef}
            className="mx-auto w-full max-w-[1380px] px-6 sm:px-10 will-change-transform"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
              <div className="lg:col-span-6 space-y-6">
                <EditorialSectionHeader
                  eyebrow="Central Philosophy"
                  title="Transend Tours is not simply somewhere you visit. It's somewhere you experience."
                  subtitle="Rather than rushing between viewpoints, we shape calm journeys connecting aerial panoramas, Upper Zambezi river hours, and sanctuary stays calibrated to your pace."
                />
                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <GlassButton to="/about" variant="forest">
                    <span>Our Philosophy</span>
                    <ArrowRight className="w-4 h-4 stroke-[1.5]" aria-hidden="true" />
                  </GlassButton>
                  <GlassButton to="/transport" variant="ivory">
                    <span>Transfers &amp; Mobility</span>
                  </GlassButton>
                </div>
              </div>

              {/* Asymmetric Vertical Portrait Plate + Hairline Editorial Note */}
              <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-12 gap-6 items-end">
                <div className="sm:col-span-7 aspect-[4/5] max-h-[420px] w-full overflow-hidden border border-[#E7E4DA] bg-[#121312]">
                  <div ref={innerInsetPhotoRef} className="w-full h-full will-change-transform">
                    <ResilientImage
                      src={IMAGE_ASSETS.livingstoneIsland}
                      alt="Basalt rim overlooking Transend Tours cascade"
                      className="w-full h-full"
                    />
                  </div>
                </div>
                <div className="sm:col-span-5 pt-4 border-t border-[#102D25]/25 space-y-3">
                  <span className="block text-[11px] uppercase tracking-[0.2em] text-[#244B3A] font-semibold">
                    Local Context
                  </span>
                  <p className="font-serif italic text-lg text-[#102D25] leading-snug">
                    “Every hour transforms the light, mist, and thunder along the basalt rim.”
                  </p>
                  <p className="text-xs text-[#788078] leading-relaxed">
                    Private guiding, vetted transfers, and seasonal planning matched to exact water levels.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
