import { useEffect, useRef } from 'react';
import { gsap, MOTION_EASE, prefersReducedMotion } from '../../motion/gsapConfig';
import { ResilientImage } from '../ResilientImage';

interface CinematicHeroMediaProps {
  src: string;
  alt: string;
  scrimClassName?: string;
}

export function CinematicHeroMedia({
  src,
  alt,
  scrimClassName = 'bg-gradient-to-t from-[#0B0C0C]/75 via-[#0B0C0C]/18 to-transparent',
}: CinematicHeroMediaProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mediaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const media = mediaRef.current;
    if (!container || !media || prefersReducedMotion()) return;

    const mm = gsap.matchMedia();
    mm.add(
      {
        isDesktop: '(min-width: 1024px)',
        isMobile: '(max-width: 1023px)',
      },
      (context) => {
        const isDesktop = context.conditions?.isDesktop ?? true;

        gsap.fromTo(
          media,
          { scale: 1.09 },
          { scale: 1, duration: 1.15, ease: MOTION_EASE.cinema }
        );

        if (isDesktop) {
          gsap.to(media, {
            yPercent: 10,
            ease: 'none',
            scrollTrigger: {
              trigger: container,
              start: 'top top',
              end: 'bottom top',
              scrub: true,
            },
          });
        }
      }
    );

    return () => mm.revert();
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden">
      <div ref={mediaRef} className="w-full h-full will-change-transform">
        <ResilientImage src={src} alt={alt} className="w-full h-full" priority />
      </div>
      <div aria-hidden="true" className={`absolute inset-0 ${scrimClassName}`} />
    </div>
  );
}
