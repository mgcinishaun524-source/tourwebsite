import { useEffect, useRef } from 'react';
import { gsap, prefersReducedMotion } from '../../motion/gsapConfig';

interface KineticMarqueeStripProps {
  phrases: string[];
  theme?: 'light' | 'dark';
}

export function KineticMarqueeStrip({
  phrases,
  theme = 'light',
}: KineticMarqueeStripProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    if (!section || !track || prefersReducedMotion()) return;

    const mm = gsap.matchMedia();

    mm.add('(min-width: 768px)', () => {
      gsap.fromTo(
        track,
        { xPercent: 4 },
        {
          xPercent: -14,
          ease: 'none',
          scrollTrigger: {
            trigger: section,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 0.8,
          },
        }
      );
    });

    return () => mm.revert();
  }, []);

  const isDark = theme === 'dark';

  return (
    <div
      ref={sectionRef}
      className={`overflow-x-clip py-7 sm:py-9 border-y ${
        isDark
          ? 'bg-[#102D25] border-[#FFFFFF]/12 text-[#D9C397]'
          : 'bg-[#F6F4ED] border-[#E7E4DA] text-[#102D25]'
      }`}
    >
      <div
        ref={trackRef}
        className="flex items-center gap-8 sm:gap-12 whitespace-nowrap px-6 sm:px-10 will-change-transform"
      >
        {[...phrases, ...phrases].map((phrase, idx) => (
          <div key={`${phrase}-${idx}`} className="flex items-center gap-8 sm:gap-12 shrink-0">
            <span className="font-logo text-2xl sm:text-4xl lg:text-[2.75rem] tracking-[0.02em]">
              {phrase}
            </span>
            <span
              aria-hidden="true"
              className={`w-2 h-2 rounded-full ${
                isDark ? 'bg-[#D9C397]/50' : 'bg-[#244B3A]/40'
              }`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
